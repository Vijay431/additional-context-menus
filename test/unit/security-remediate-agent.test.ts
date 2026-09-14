import { describe, it, expect } from 'vitest';
import {
  ALLOWED_PATHS,
  isAllowedPath,
  isAllowedCommand,
  validateFinalizeDecision,
  countCriticalHigh,
} from '../../.github/scripts/security-remediate-agent.mjs';

describe('isAllowedPath', () => {
  it('should accept each of the three exact allowlisted paths', () => {
    for (const p of ALLOWED_PATHS) {
      expect(isAllowedPath(p)).toBe(true);
    }
  });

  it('should reject a path not on the allowlist', () => {
    expect(isAllowedPath('src/extension.ts')).toBe(false);
  });

  it('should reject path traversal attempts', () => {
    expect(isAllowedPath('../../etc/passwd')).toBe(false);
    expect(isAllowedPath('./package.json/../../../etc/passwd')).toBe(false);
    expect(isAllowedPath('package.json/../secrets.env')).toBe(false);
  });

  it('should reject absolute paths', () => {
    expect(isAllowedPath('/etc/passwd')).toBe(false);
  });

  it('should reject a path that merely contains an allowlisted name as a substring/suffix', () => {
    expect(isAllowedPath('nested/package.json')).toBe(false);
    expect(isAllowedPath('package.json.bak')).toBe(false);
  });

  it('should reject non-string input', () => {
    expect(isAllowedPath(null as unknown as string)).toBe(false);
    expect(isAllowedPath(undefined as unknown as string)).toBe(false);
    expect(isAllowedPath(42 as unknown as string)).toBe(false);
  });
});

describe('isAllowedCommand', () => {
  it('should accept each allowlisted exact prefix with typical trailing args', () => {
    expect(isAllowedCommand('pnpm', ['update', 'lodash'])).toBe(true);
    expect(isAllowedCommand('pnpm', ['audit', '--json'])).toBe(true);
    expect(isAllowedCommand('pnpm', ['install'])).toBe(true);
    expect(isAllowedCommand('pnpm', ['run', 'build'])).toBe(true);
    expect(isAllowedCommand('pnpm', ['run', 'test:unit'])).toBe(true);
    expect(isAllowedCommand('git', ['status'])).toBe(true);
    expect(isAllowedCommand('git', ['diff'])).toBe(true);
    expect(isAllowedCommand('git', ['log'])).toBe(true);
    expect(isAllowedCommand('git', ['show'])).toBe(true);
  });

  it('should reject a command not on the allowlist', () => {
    expect(isAllowedCommand('rm', ['-rf', '/'])).toBe(false);
    expect(isAllowedCommand('curl', ['https://example.com'])).toBe(false);
  });

  it('should reject gh entirely and reject mutating git subcommands (commit/push/checkout/merge/reset)', () => {
    // Only main() itself is allowed to commit/push/open or close PRs, after
    // independently re-verifying a fix — never the agent loop. See the
    // ALLOWED_COMMAND_PREFIXES comment in the source for the threat this
    // closes: untrusted text read via list_dependabot_prs/merge_dependabot_branch
    // could otherwise prompt-inject the model into bypassing verification
    // entirely via a direct git push/gh pr merge.
    expect(isAllowedCommand('gh', ['pr', 'list'])).toBe(false);
    expect(isAllowedCommand('gh', ['pr', 'merge', '1', '--admin'])).toBe(false);
    expect(isAllowedCommand('git', ['push', '--force', 'origin', 'main'])).toBe(false);
    expect(isAllowedCommand('git', ['commit', '-m', 'x'])).toBe(false);
    expect(isAllowedCommand('git', ['checkout', 'other-ref', '--', '.github/workflows/release.yml'])).toBe(false);
    expect(isAllowedCommand('git', ['merge', 'some-branch'])).toBe(false);
    expect(isAllowedCommand('git', ['reset', '--hard'])).toBe(false);
  });

  it('should accept shell-injection-shaped args passed through legitimately-allowlisted commands', () => {
    // isAllowedCommand only validates the command prefix, not the content of
    // trailing args. This is safe by design: the script invokes commands via
    // execFile with an argv array (never a shell string), so a value like
    // "; rm -rf /" is passed as a single literal argument and is never
    // interpreted by a shell. Document the real (permissive-on-args) behavior
    // rather than asserting a false expectation.
    expect(isAllowedCommand('pnpm', ['install', '; rm -rf /'])).toBe(true);
  });

  it('should reject "pnpm run test" (only test:unit is allowlisted)', () => {
    expect(isAllowedCommand('pnpm', ['run', 'test'])).toBe(false);
  });

  it('should reject "pnpm run test:integration" (only test:unit is allowlisted)', () => {
    expect(isAllowedCommand('pnpm', ['run', 'test:integration'])).toBe(false);
  });

  it('should reject case-mismatched command names', () => {
    expect(isAllowedCommand('Pnpm', ['update'])).toBe(false);
    expect(isAllowedCommand('Git', ['status'])).toBe(false);
  });

  it('should reject partial-prefix bypass attempts (exact-segment matching, not startsWith)', () => {
    expect(isAllowedCommand('pnpm', ['updated'])).toBe(false);
    expect(isAllowedCommand('pnpm', ['auditor'])).toBe(false);
  });

  it('should reject when args is missing/not an array', () => {
    expect(isAllowedCommand('git', undefined as unknown as string[])).toBe(false);
    expect(isAllowedCommand('git', 'status' as unknown as string[])).toBe(false);
  });

  it('should reject when args contains non-string entries', () => {
    expect(isAllowedCommand('pnpm', ['update', 42 as unknown as string])).toBe(false);
  });

  it('should reject a non-string or empty cmd', () => {
    expect(isAllowedCommand('', ['status'])).toBe(false);
    expect(isAllowedCommand(null as unknown as string, ['status'])).toBe(false);
  });
});

describe('validateFinalizeDecision', () => {
  it('should accept a well-formed open_pr decision', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: 'Bumped lodash to 4.17.21',
      packagesFixed: ['lodash'],
      supersedesPrs: [123],
    });
    expect(result).toEqual({ valid: true });
  });

  it('should accept a well-formed open_pr decision with empty arrays', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: 'Bumped lodash to 4.17.21',
      packagesFixed: [],
      supersedesPrs: [],
    });
    expect(result).toEqual({ valid: true });
  });

  it('should accept a well-formed no_fix decision', () => {
    const result = validateFinalizeDecision({ action: 'no_fix', reason: 'No safe upgrade path available' });
    expect(result).toEqual({ valid: true });
  });

  it('should reject an unknown action value', () => {
    const result = validateFinalizeDecision({ action: 'delete_everything' });
    expect(result.valid).toBe(false);
  });

  it('should reject open_pr missing summary', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      packagesFixed: ['lodash'],
      supersedesPrs: [],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject open_pr missing packagesFixed', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: 'fix',
      supersedesPrs: [],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject open_pr missing supersedesPrs', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: 'fix',
      packagesFixed: ['lodash'],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject open_pr where packagesFixed is a string instead of an array', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: 'fix',
      packagesFixed: 'lodash',
      supersedesPrs: [],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject open_pr where supersedesPrs contains non-numbers', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: 'fix',
      packagesFixed: ['lodash'],
      supersedesPrs: ['123'],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject open_pr where supersedesPrs contains non-integer numbers', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: 'fix',
      packagesFixed: ['lodash'],
      supersedesPrs: [1.5],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject open_pr with an empty-string summary', () => {
    const result = validateFinalizeDecision({
      action: 'open_pr',
      summary: '   ',
      packagesFixed: ['lodash'],
      supersedesPrs: [],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject no_fix missing reason', () => {
    const result = validateFinalizeDecision({ action: 'no_fix' });
    expect(result.valid).toBe(false);
  });

  it('should reject no_fix with an empty-string reason', () => {
    const result = validateFinalizeDecision({ action: 'no_fix', reason: '' });
    expect(result.valid).toBe(false);
  });

  it('should reject null, undefined, and non-object input', () => {
    expect(validateFinalizeDecision(null).valid).toBe(false);
    expect(validateFinalizeDecision(undefined).valid).toBe(false);
    expect(validateFinalizeDecision('open_pr').valid).toBe(false);
    expect(validateFinalizeDecision(42).valid).toBe(false);
    expect(validateFinalizeDecision([]).valid).toBe(false);
  });
});

describe('countCriticalHigh', () => {
  it('should sum critical+high from a metadata.vulnerabilities-shaped audit JSON', () => {
    const audit = {
      metadata: {
        vulnerabilities: { info: 1, low: 2, moderate: 3, high: 4, critical: 5 },
      },
    };
    expect(countCriticalHigh(audit)).toBe(9);
  });

  it('should sum critical+high from an advisories-shaped audit JSON', () => {
    const audit = {
      advisories: {
        '1001': { severity: 'critical' },
        '1002': { severity: 'high' },
        '1003': { severity: 'moderate' },
        '1004': { severity: 'low' },
      },
    };
    expect(countCriticalHigh(audit)).toBe(2);
  });

  it('should return 0 for an audit JSON with no vulnerabilities', () => {
    expect(countCriticalHigh({ metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } } })).toBe(
      0,
    );
    expect(countCriticalHigh({ advisories: {} })).toBe(0);
    expect(countCriticalHigh({})).toBe(0);
  });

  it('should return 0 for null, undefined, or non-object input', () => {
    expect(countCriticalHigh(null)).toBe(0);
    expect(countCriticalHigh(undefined)).toBe(0);
    expect(countCriticalHigh('not json')).toBe(0);
  });
});
