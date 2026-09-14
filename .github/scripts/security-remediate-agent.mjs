#!/usr/bin/env node
/**
 * security-remediate-agent.mjs
 *
 * CI script (run as a step in the `security-remediate` job of
 * .github/workflows/security-daily.yml) that uses an LLM tool-calling agent
 * to attempt a genuine fix for critical/high `pnpm audit` findings, then
 * INDEPENDENTLY verifies the fix before ever opening a PR.
 *
 * Core design principle: the LLM decides *what* to try by calling a narrow,
 * injection-resistant set of tools. This script alone decides *whether it
 * worked*, by re-running `pnpm audit` and the build/test suite after the
 * agent loop ends. The agent's own claim of success is never trusted.
 *
 * Pure Node.js ESM, no TypeScript, no dependencies beyond `openai` and Node
 * builtins. Assumes cwd is the repo root, already checked out with
 * dependencies installed by the calling workflow step.
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// Pure, side-effect-free validators (exported for unit testing).
// ---------------------------------------------------------------------------

/** The only files the agent is ever allowed to read or write. */
export const ALLOWED_PATHS = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'];

/**
 * Exact-match allowlist check for read_file/write_file paths. Deliberately
 * NOT a prefix or regex check (those can be bypassed with `../`).
 * @param {unknown} filePath
 * @returns {boolean}
 */
export function isAllowedPath(filePath) {
  return typeof filePath === 'string' && ALLOWED_PATHS.includes(filePath);
}

/**
 * Exact-prefix allowlist for run_command. Each entry is an array of tokens
 * that must match the start of [cmd, ...args].
 *
 * Deliberately excludes any mutating `git`/`gh` subcommand (commit, push,
 * checkout <ref> -- <path>, merge, reset, tag, `gh pr create/close/merge`,
 * etc.) and excludes `gh` entirely. Those capabilities are performed
 * exclusively by this script's own main() after independent verification —
 * never by the agent loop. Without this restriction, untrusted text the
 * agent reads via list_dependabot_prs/merge_dependabot_branch (e.g. a
 * Dependabot PR title/body, which can contain attacker-influenced upstream
 * changelog content) could prompt-inject the model into calling
 * run_command('git', ['push', '--force', ...]) or similar, bypassing the
 * verification gate entirely. Only read-only git inspection is allowed here.
 */
const ALLOWED_COMMAND_PREFIXES = [
  ['pnpm', 'update'],
  ['pnpm', 'audit'],
  ['pnpm', 'install'],
  ['pnpm', 'run', 'build'],
  ['pnpm', 'run', 'test:unit'],
  ['git', 'status'],
  ['git', 'diff'],
  ['git', 'log'],
  ['git', 'show'],
];

/**
 * Validates a (cmd, args) pair against the exact-prefix command allowlist.
 * Pure function: no env/fs/network access.
 * @param {unknown} cmd
 * @param {unknown} args
 * @returns {boolean}
 */
export function isAllowedCommand(cmd, args) {
  if (typeof cmd !== 'string' || cmd.length === 0) return false;
  if (!Array.isArray(args) || !args.every((a) => typeof a === 'string')) return false;
  const full = [cmd, ...args];
  return ALLOWED_COMMAND_PREFIXES.some((prefix) => {
    if (full.length < prefix.length) return false;
    return prefix.every((token, i) => full[i] === token);
  });
}

/**
 * Strictly validates the shape of the agent's terminal `finalize` decision.
 * Does not coerce or fill in defaults — an invalid shape is rejected so the
 * agent can retry with a valid one.
 * @param {unknown} decision
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
export function validateFinalizeDecision(decision) {
  if (typeof decision !== 'object' || decision === null || Array.isArray(decision)) {
    return { valid: false, error: 'decision must be a JSON object' };
  }

  if (decision.action === 'open_pr') {
    if (typeof decision.summary !== 'string' || decision.summary.trim().length === 0) {
      return { valid: false, error: 'open_pr requires a non-empty string "summary"' };
    }
    if (!Array.isArray(decision.packagesFixed) || !decision.packagesFixed.every((p) => typeof p === 'string')) {
      return { valid: false, error: 'open_pr requires "packagesFixed" to be an array of strings' };
    }
    if (
      !Array.isArray(decision.supersedesPrs) ||
      !decision.supersedesPrs.every((n) => typeof n === 'number' && Number.isInteger(n))
    ) {
      return { valid: false, error: 'open_pr requires "supersedesPrs" to be an array of integers (may be empty)' };
    }
    return { valid: true };
  }

  if (decision.action === 'no_fix') {
    if (typeof decision.reason !== 'string' || decision.reason.trim().length === 0) {
      return { valid: false, error: 'no_fix requires a non-empty string "reason"' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'decision.action must be exactly "open_pr" or "no_fix"' };
}

/**
 * Sums critical + high vulnerability counts from a `pnpm audit --json`
 * payload. Handles the npm-audit-compatible `metadata.vulnerabilities`
 * shape and falls back to scanning an `advisories` map. Pure function.
 * @param {unknown} auditJson
 * @returns {number}
 */
export function countCriticalHigh(auditJson) {
  if (!auditJson || typeof auditJson !== 'object') return 0;

  const vulnCounts = auditJson.metadata && auditJson.metadata.vulnerabilities;
  if (vulnCounts && typeof vulnCounts === 'object') {
    const critical = Number(vulnCounts.critical) || 0;
    const high = Number(vulnCounts.high) || 0;
    return critical + high;
  }

  if (auditJson.advisories && typeof auditJson.advisories === 'object') {
    return Object.values(auditJson.advisories).filter(
      (a) => a && typeof a === 'object' && (a.severity === 'critical' || a.severity === 'high'),
    ).length;
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Process/fs helpers (side-effecting; not exported).
// ---------------------------------------------------------------------------

function execCapture(cmd, args, cwd) {
  return new Promise((resolve) => {
    execFile(
      cmd,
      args,
      { cwd: cwd || process.cwd(), maxBuffer: 1024 * 1024 * 64, encoding: 'utf8' },
      (error, stdout, stderr) => {
        resolve({
          code: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
          stdout: stdout || '',
          stderr: stderr || (error ? String(error.message || error) : ''),
        });
      },
    );
  });
}

/**
 * Breaks GitHub's issue/PR auto-linking and closing-keyword behavior
 * (`Fixes #123`, `Closes #123`, etc.) in untrusted, LLM-generated text
 * before it's interpolated into a commit message or PR body, by inserting
 * a zero-width space between `#` and a following digit. Visually identical,
 * but no longer matches GitHub's reference pattern, so the agent's summary
 * text can't cause an unrelated issue/PR to auto-close when a human merges.
 * @param {unknown} text
 * @returns {string}
 */
const ZERO_WIDTH_SPACE = '​';
function sanitizeUntrustedText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/#(\d+)/g, `#${ZERO_WIDTH_SPACE}$1`);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function readAuditImpl(repoRoot) {
  const result = await execCapture('pnpm', ['audit', '--json'], repoRoot);
  const parsed = safeJsonParse(result.stdout);
  if (parsed === null) {
    return { code: result.code, parseError: true, rawStdout: result.stdout.slice(0, 8000), stderr: result.stderr };
  }
  return { code: result.code, audit: parsed };
}

async function listDependabotPrsImpl(repoRoot) {
  const result = await execCapture(
    'gh',
    ['pr', 'list', '--author', 'dependabot[bot]', '--state', 'open', '--json', 'number,headRefName,title,body'],
    repoRoot,
  );
  if (result.code !== 0) {
    return { error: `gh pr list failed (exit ${result.code}): ${result.stderr}` };
  }
  const parsed = safeJsonParse(result.stdout);
  if (parsed === null) {
    return { error: `failed to parse gh pr list output as JSON` };
  }
  return parsed;
}

async function mergeDependabotBranchImpl(prNumber, repoRoot) {
  if (typeof prNumber !== 'number' || !Number.isInteger(prNumber) || prNumber <= 0) {
    return { error: 'prNumber must be a positive integer' };
  }

  const branch = `pr-${prNumber}`;
  const fetchResult = await execCapture('git', ['fetch', 'origin', `pull/${prNumber}/head:${branch}`], repoRoot);
  if (fetchResult.code !== 0) {
    return { error: `git fetch failed for PR #${prNumber}: ${fetchResult.stderr}` };
  }

  const merged = [];
  const skipped = [];
  for (const file of ALLOWED_PATHS) {
    const existsResult = await execCapture('git', ['cat-file', '-e', `${branch}:${file}`], repoRoot);
    if (existsResult.code !== 0) {
      skipped.push(file);
      continue;
    }
    const checkoutResult = await execCapture('git', ['checkout', branch, '--', file], repoRoot);
    if (checkoutResult.code !== 0) {
      return { error: `git checkout of ${file} from PR #${prNumber} failed: ${checkoutResult.stderr}` };
    }
    merged.push(file);
  }

  return { branch, merged, skipped };
}

async function readFileImpl(filePath, repoRoot) {
  if (!isAllowedPath(filePath)) {
    return { error: `path not allowed: ${JSON.stringify(filePath)}` };
  }
  try {
    const content = await fs.readFile(path.join(repoRoot, filePath), 'utf8');
    return { path: filePath, content };
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      return { path: filePath, content: '', notFound: true };
    }
    return { error: `failed to read ${filePath}: ${e.message}` };
  }
}

async function writeFileImpl(filePath, content, repoRoot) {
  if (!isAllowedPath(filePath)) {
    return { error: `path not allowed: ${JSON.stringify(filePath)}` };
  }
  if (typeof content !== 'string') {
    return { error: 'content must be a string' };
  }
  try {
    await fs.writeFile(path.join(repoRoot, filePath), content, 'utf8');
    return { path: filePath, written: true, bytes: Buffer.byteLength(content, 'utf8') };
  } catch (e) {
    return { error: `failed to write ${filePath}: ${e.message}` };
  }
}

async function runCommandImpl(cmd, args, repoRoot) {
  const argList = Array.isArray(args) ? args : [];
  if (!isAllowedCommand(cmd, argList)) {
    return { error: `command not allowed: ${JSON.stringify(cmd)} ${JSON.stringify(argList)}` };
  }
  const result = await execCapture(cmd, argList, repoRoot);
  return {
    code: result.code,
    stdout: result.stdout.slice(0, 20000),
    stderr: result.stderr.slice(0, 20000),
  };
}

// ---------------------------------------------------------------------------
// OpenAI tool definitions.
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_audit',
      description:
        'Run `pnpm audit --json` and return the parsed vulnerability report (advisories, severities, fixAvailable info).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dependabot_prs',
      description:
        'List open Dependabot pull requests (number, headRefName, title, body) via `gh pr list`. Prefer reusing an existing Dependabot PR\'s already-resolved version over recomputing one yourself.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'merge_dependabot_branch',
      description:
        "Merge an open Dependabot PR branch's package.json/pnpm-lock.yaml/pnpm-workspace.yaml into the current working tree, reusing its already-resolved dependency versions instead of recomputing them.",
      parameters: {
        type: 'object',
        properties: {
          prNumber: { type: 'integer', description: 'The Dependabot PR number to merge from.' },
        },
        required: ['prNumber'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: `Read the contents of an allowlisted file. Only these exact paths are allowed: ${ALLOWED_PATHS.join(', ')}.`,
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', enum: ALLOWED_PATHS } },
        required: ['path'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: `Write contents to an allowlisted file. Only these exact paths are allowed: ${ALLOWED_PATHS.join(', ')}.`,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', enum: ALLOWED_PATHS },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description:
        'Run an allowlisted command with an argv array (no shell string, no shell interpolation). Allowed prefixes: "pnpm update", "pnpm audit", "pnpm install", "pnpm run build", "pnpm run test:unit", "git status", "git diff", "git log", "git show". Mutating git operations (commit, push, checkout, merge) and all gh operations are NOT available here — they are performed only by the calling script after independent verification. Anything not allowlisted is rejected with an error you can read and adapt to.',
      parameters: {
        type: 'object',
        properties: {
          cmd: { type: 'string', description: 'The command name, e.g. "pnpm", "git", "gh".' },
          args: {
            type: 'array',
            items: { type: 'string' },
            description: 'Argument list, e.g. ["update", "lodash@4.17.21"].',
          },
        },
        required: ['cmd', 'args'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finalize',
      description:
        'Terminate the remediation loop. You MUST call this exactly once, as your last action. Use {action:"open_pr", summary, packagesFixed, supersedesPrs} only if you have a genuine fix you believe resolves the vulnerabilities. Use {action:"no_fix", reason} if nothing genuinely resolves them. Never fabricate success — the calling script will independently re-verify everything you claim.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['open_pr', 'no_fix'] },
          summary: { type: 'string', description: 'Required for open_pr: human-readable summary of the fix.' },
          packagesFixed: {
            type: 'array',
            items: { type: 'string' },
            description: 'Required for open_pr: package names/versions changed.',
          },
          supersedesPrs: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Required for open_pr: Dependabot PR numbers this fix supersedes (empty array if none).',
          },
          reason: { type: 'string', description: 'Required for no_fix: why no fix was possible.' },
        },
        required: ['action'],
        additionalProperties: false,
      },
    },
  },
];

/**
 * Builds the per-run tool implementations, closed over repoRoot and a local
 * (non-module-level) mutable state holder for the finalize decision so
 * concurrent/test invocations never share state.
 */
function createToolImplementations(repoRoot) {
  const state = { finalDecision: null };

  const impls = {
    read_audit: () => readAuditImpl(repoRoot),
    list_dependabot_prs: () => listDependabotPrsImpl(repoRoot),
    merge_dependabot_branch: (args) => mergeDependabotBranchImpl(args && args.prNumber, repoRoot),
    read_file: (args) => readFileImpl(args && args.path, repoRoot),
    write_file: (args) => writeFileImpl(args && args.path, args && args.content, repoRoot),
    run_command: (args) => runCommandImpl(args && args.cmd, args && args.args, repoRoot),
    finalize: (args) => {
      const validation = validateFinalizeDecision(args);
      if (!validation.valid) {
        return { error: `invalid finalize decision: ${validation.error}` };
      }
      state.finalDecision = args;
      return { accepted: true };
    },
  };

  return { state, impls };
}

// ---------------------------------------------------------------------------
// Agent loop.
// ---------------------------------------------------------------------------

const MAX_TOOL_TURNS = 15;

function buildSystemPrompt() {
  return [
    'You are an automated security remediation agent running in a CI job with real write access to a git repository.',
    'Your task: genuinely fix the critical/high vulnerabilities reported by `pnpm audit` in this repository.',
    '',
    'Available tools:',
    '- read_audit: re-run `pnpm audit --json` for a fresh view of current vulnerabilities.',
    '- list_dependabot_prs: list open Dependabot PRs. ALWAYS call this before attempting a fix. If an open Dependabot PR already targets the same package(s), prefer merge_dependabot_branch to reuse its already-resolved, already-tested version rather than recomputing one yourself.',
    '- merge_dependabot_branch(prNumber): merge an open Dependabot PR branch\'s package.json/pnpm-lock.yaml/pnpm-workspace.yaml into your working tree.',
    '- read_file(path) / write_file(path, content): read or write package.json, pnpm-lock.yaml, or pnpm-workspace.yaml only.',
    '- run_command(cmd, args): run an allowlisted command (pnpm update/audit/install/run build/run test:unit, or read-only git status/diff/log/show) as an argv array. Mutating git operations and gh are not available to you — committing, pushing, and opening/closing PRs are done only by the calling script after it independently verifies your fix. Anything not on the allowlist is rejected with an error — adapt, do not retry the same disallowed command.',
    '- finalize(decision): the ONLY way to end this session. You MUST call it exactly once, as your final action.',
    '',
    'Rules:',
    '- Never fabricate or assume success. The calling script independently re-runs `pnpm audit`, `pnpm install`, `pnpm run build`, and `pnpm run test:unit` after you finish, and only trusts those measured results — not anything you say.',
    '- If you cannot find a change that plausibly fixes the vulnerabilities without breaking the build/tests, call finalize({action: "no_fix", reason: "<why>"}). This is a normal, expected, and acceptable outcome — do not force a change just to have something to report.',
    '- If you do make a change you believe fixes the vulnerabilities, call finalize({action: "open_pr", summary, packagesFixed, supersedesPrs}) where supersedesPrs lists any Dependabot PR numbers your fix makes redundant (use [] if none).',
    '- You MUST end by calling finalize. The session is capped at a fixed number of tool-call turns; running out without calling finalize is treated as a failure to fix anything.',
  ].join('\n');
}

function buildInitialContext({ baselineAudit, baselineCount }) {
  const auditSummary = baselineAudit
    ? JSON.stringify(baselineAudit).slice(0, 12000)
    : '(audit output was not valid JSON; call read_audit yourself for a fresh view)';
  return [
    `Baseline \`pnpm audit --json\` found ${baselineCount} combined critical+high severity issue(s).`,
    'Baseline audit output (may be truncated):',
    auditSummary,
    '',
    'Begin by calling list_dependabot_prs, then decide on a remediation approach.',
  ].join('\n');
}

async function runAgentLoop({ client, model, systemPrompt, initialContext, repoRoot, log }) {
  const { state, impls } = createToolImplementations(repoRoot);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: initialContext },
  ];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await client.chat.completions.create({
      model,
      messages,
      tools: TOOLS,
    });

    const choice = response.choices && response.choices[0];
    const message = choice && choice.message;
    if (!message) {
      throw new Error('OpenAI response contained no choices/message');
    }
    messages.push(message);

    const toolCalls = message.tool_calls || [];
    if (toolCalls.length === 0) {
      messages.push({
        role: 'user',
        content:
          'You must call a tool on every turn. If you are done investigating, call finalize with a valid decision.',
      });
      continue;
    }

    for (const toolCall of toolCalls) {
      const name = toolCall.function && toolCall.function.name;
      let args;
      try {
        const rawArgs = toolCall.function && toolCall.function.arguments;
        args = rawArgs ? JSON.parse(rawArgs) : {};
      } catch (e) {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: `failed to parse tool arguments as JSON: ${e.message}` }),
        });
        continue;
      }

      const impl = impls[name];
      if (!impl) {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: `unknown tool: ${String(name)}` }),
        });
        continue;
      }

      let result;
      try {
        result = await impl(args);
      } catch (e) {
        result = { error: `tool ${name} threw: ${e && e.message}` };
      }

      if (log) {
        log(`tool call: ${name}(${JSON.stringify(args)}) -> ${JSON.stringify(result).slice(0, 500)}`);
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });

      if (name === 'finalize' && state.finalDecision) {
        return { decision: state.finalDecision, messages };
      }
    }
  }

  return {
    decision: { action: 'no_fix', reason: 'agent loop exceeded max turns' },
    messages,
  };
}

// ---------------------------------------------------------------------------
// GitHub Actions output helpers.
// ---------------------------------------------------------------------------

async function writeGithubOutput(key, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const delimiter = `ghadelim_${key}_${process.pid}`;
  const block = `${key}<<${delimiter}\n${value}\n${delimiter}\n`;
  await fs.appendFile(outputPath, block, 'utf8');
}

async function writeResult(repoRoot, result) {
  await fs.writeFile(path.join(repoRoot, 'remediation-result.json'), JSON.stringify(result, null, 2), 'utf8');
  await writeGithubOutput('result', result.result);
  if (result.pr_number) {
    await writeGithubOutput('pr_number', String(result.pr_number));
  }
}

// ---------------------------------------------------------------------------
// main()
// ---------------------------------------------------------------------------

async function main() {
  const repoRoot = process.cwd();

  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error('OPENAI_MODEL environment variable is required (no default model is hardcoded in this script).');
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required.');
  }

  console.log('[security-remediate] running baseline `pnpm audit --json`...');
  const baselineRaw = await execCapture('pnpm', ['audit', '--json'], repoRoot);
  const baselineAudit = safeJsonParse(baselineRaw.stdout);
  if (baselineAudit === null) {
    // Fail closed: a parse failure is an unknown state, not a confirmed
    // absence of vulnerabilities. Treating it as baselineCount===0 would
    // silently mask the exact condition (critical/high > 0) that triggered
    // this job, and skip remediation while reporting success.
    throw new Error(
      `baseline \`pnpm audit --json\` output was not valid JSON (exit ${baselineRaw.code}); cannot determine vulnerability state. stderr: ${baselineRaw.stderr.slice(0, 2000)}`,
    );
  }
  const baselineCount = countCriticalHigh(baselineAudit);
  console.log(`[security-remediate] baseline critical+high vulnerabilities: ${baselineCount}`);

  if (baselineCount === 0) {
    console.log('[security-remediate] no critical/high vulnerabilities at baseline; nothing to remediate.');
    await writeResult(repoRoot, { result: 'no_fix', reason: 'no critical/high vulnerabilities at baseline' });
    return;
  }

  // Independently captured now, used later to cross-check the agent's
  // supersedesPrs claims — never trust the agent's own recollection of PRs.
  const confirmedDependabotPrs = await listDependabotPrsImpl(repoRoot);
  const confirmedDependabotNumbers = new Set(
    Array.isArray(confirmedDependabotPrs) ? confirmedDependabotPrs.map((pr) => pr.number) : [],
  );

  const client = new OpenAI();

  const systemPrompt = buildSystemPrompt();
  const initialContext = buildInitialContext({ baselineAudit, baselineCount });

  console.log('[security-remediate] starting agent loop...');
  const { decision } = await runAgentLoop({
    client,
    model,
    systemPrompt,
    initialContext,
    repoRoot,
    log: (msg) => console.log(`[security-remediate] ${msg}`),
  });

  console.log(`[security-remediate] agent finalized: ${JSON.stringify(decision)}`);

  if (decision.action === 'no_fix') {
    console.log(`[security-remediate] no_fix: ${decision.reason}`);
    await writeResult(repoRoot, { result: 'no_fix', reason: decision.reason });
    return;
  }

  // decision.action === 'open_pr' — independently re-verify everything.
  console.log('[security-remediate] agent claims a fix; independently verifying (ignoring agent claims)...');

  // `pnpm install` MUST run before the post-fix audit: it's the step that
  // reconciles pnpm-lock.yaml against package.json/overrides, and can
  // silently re-resolve a vulnerable version back in (exit 0) if the agent's
  // lockfile edit was incomplete. Auditing the post-install state, not the
  // agent's raw edit, is what the "genuinely fixes" gate actually needs to
  // measure.
  const installResult = await execCapture('pnpm', ['install'], repoRoot);
  if (installResult.code !== 0) {
    console.log(`[security-remediate] verification FAILED: pnpm install exited ${installResult.code}.`);
    await writeResult(repoRoot, { result: 'fix_failed_verification', reason: 'pnpm install failed after fix' });
    return;
  }

  const postAuditRaw = await execCapture('pnpm', ['audit', '--json'], repoRoot);
  const postAudit = safeJsonParse(postAuditRaw.stdout);
  if (postAudit === null) {
    // Fail closed here too: countCriticalHigh(null) would be 0, which would
    // read as "fully fixed" and let a parse failure masquerade as success.
    console.log('[security-remediate] verification FAILED: post-fix audit output was not valid JSON.');
    await writeResult(repoRoot, {
      result: 'fix_failed_verification',
      reason: 'post-fix `pnpm audit --json` output was not valid JSON; cannot confirm the fix',
    });
    return;
  }
  const postCount = countCriticalHigh(postAudit);
  console.log(`[security-remediate] post-fix critical+high vulnerabilities: ${postCount}`);

  if (!(postCount < baselineCount)) {
    console.log('[security-remediate] verification FAILED: vulnerability count did not decrease.');
    await writeResult(repoRoot, {
      result: 'fix_failed_verification',
      reason: `vulnerability count did not decrease (baseline ${baselineCount}, post-fix ${postCount})`,
    });
    return;
  }

  const buildResult = await execCapture('pnpm', ['run', 'build'], repoRoot);
  if (buildResult.code !== 0) {
    console.log(`[security-remediate] verification FAILED: pnpm run build exited ${buildResult.code}.`);
    await writeResult(repoRoot, { result: 'fix_failed_verification', reason: 'build failed after fix' });
    return;
  }

  const testResult = await execCapture('pnpm', ['run', 'test:unit'], repoRoot);
  if (testResult.code !== 0) {
    console.log(`[security-remediate] verification FAILED: pnpm run test:unit exited ${testResult.code}.`);
    await writeResult(repoRoot, { result: 'fix_failed_verification', reason: 'unit tests failed after fix' });
    return;
  }

  const diffStat = await execCapture('git', ['diff', '--stat'], repoRoot);
  if (!diffStat.stdout || diffStat.stdout.trim().length === 0) {
    console.log('[security-remediate] verification FAILED: no tracked file changes detected.');
    await writeResult(repoRoot, { result: 'fix_failed_verification', reason: 'no tracked changes found after fix' });
    return;
  }

  console.log('[security-remediate] verification PASSED. Opening PR...');

  const runId = process.env.GITHUB_RUN_NUMBER || String(process.pid);
  const branchName = `security/auto-fix-${runId}`;

  const checkoutBranch = await execCapture('git', ['checkout', '-b', branchName], repoRoot);
  if (checkoutBranch.code !== 0) {
    throw new Error(`failed to create branch ${branchName}: ${checkoutBranch.stderr}`);
  }

  const addResult = await execCapture('git', ['add', '-A'], repoRoot);
  if (addResult.code !== 0) {
    throw new Error(`git add failed: ${addResult.stderr}`);
  }

  // decision.summary/packagesFixed are LLM-generated (untrusted) text —
  // sanitize before interpolating into a commit message/PR body a human
  // will later merge, so it can't trigger GitHub's auto-close-on-merge
  // keyword behavior against an unrelated issue/PR.
  const packagesFixed = (Array.isArray(decision.packagesFixed) ? decision.packagesFixed : []).map(
    sanitizeUntrustedText,
  );
  const safeSummary = sanitizeUntrustedText(decision.summary);
  const commitMessage = [
    'fix(security): automated dependency remediation',
    '',
    `Packages fixed: ${packagesFixed.length ? packagesFixed.join(', ') : '(none listed)'}`,
  ].join('\n');
  const commitResult = await execCapture('git', ['commit', '-m', commitMessage], repoRoot);
  if (commitResult.code !== 0) {
    throw new Error(`git commit failed: ${commitResult.stderr}`);
  }

  const pushResult = await execCapture('git', ['push', 'origin', branchName], repoRoot);
  if (pushResult.code !== 0) {
    throw new Error(`git push failed: ${pushResult.stderr}`);
  }

  const prBody = [
    '## Summary',
    safeSummary,
    '',
    '## Packages fixed',
    packagesFixed.length ? packagesFixed.map((p) => `- ${p}`).join('\n') : '(none listed)',
    '',
    '## Verification (measured by this script, not the agent)',
    `- Baseline critical+high vulnerabilities: ${baselineCount}`,
    `- Post-fix critical+high vulnerabilities: ${postCount}`,
    '- `pnpm install`, `pnpm run build`, and `pnpm run test:unit` all exited 0 after the fix.',
  ].join('\n');

  const prCreateResult = await execCapture(
    'gh',
    [
      'pr',
      'create',
      '--base',
      'main',
      '--head',
      branchName,
      '--title',
      'fix(security): automated dependency remediation',
      '--body',
      prBody,
    ],
    repoRoot,
  );
  if (prCreateResult.code !== 0) {
    throw new Error(`gh pr create failed: ${prCreateResult.stderr}`);
  }

  const prUrl = prCreateResult.stdout.trim();
  const prNumberMatch = prUrl.match(/\/pull\/(\d+)/);
  const prNumber = prNumberMatch ? prNumberMatch[1] : '';
  console.log(`[security-remediate] opened PR: ${prUrl}`);

  const supersedesPrs = Array.isArray(decision.supersedesPrs) ? decision.supersedesPrs : [];
  for (const num of supersedesPrs) {
    if (!confirmedDependabotNumbers.has(num)) {
      console.log(
        `[security-remediate] skipping supersedesPrs entry #${num}: not a confirmed open Dependabot PR number.`,
      );
      continue;
    }
    const closeResult = await execCapture(
      'gh',
      ['pr', 'close', String(num), '--comment', `Superseded by #${prNumber}`],
      repoRoot,
    );
    if (closeResult.code !== 0) {
      console.log(`[security-remediate] failed to close PR #${num}: ${closeResult.stderr}`);
    } else {
      console.log(`[security-remediate] closed superseded PR #${num}`);
    }
  }

  await writeResult(repoRoot, { result: 'open_pr', pr_number: prNumber });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('[security-remediate] fatal error:', (error && error.stack) || error);
    process.exitCode = 1;
  });
}
