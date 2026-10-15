# Contributing to Additional Context Menus

## Project Overview

- **Name:** Additional Context Menus
- **Publisher:** VijayGangatharan
- **Version:** 2.1.2
- **VS Code engine:** >=1.111.0
- **Node.js:** >=22 runtime (22, 24, 26 supported); dev uses Node 24 LTS (`lts/krypton`)
- **Package manager:** pnpm (`pnpm-workspace.yaml` owns `overrides` and `allowBuilds`; do not put them in `package.json`)
- **Language:** TypeScript (strict mode)
- **Bundle tool:** esbuild (via `esbuild.config.ts`)
- **Published to:** VS Code Marketplace and Open VSX Registry

## Development Commands

```bash
pnpm install              # install dependencies
pnpm run build            # build extension (~1s)
pnpm run watch            # watch mode
pnpm run clean            # remove dist/ and *.vsix
pnpm run rebuild          # clean + build + package
pnpm run package          # production build (.vsix)
pnpm run lint             # ESLint
pnpm run lint:fix         # auto-fix lint issues
pnpm run format           # format files with Prettier
pnpm run test:unit        # run unit tests (Vitest)
pnpm run test:unit:coverage # run unit tests with LCOV coverage
pnpm run test:integration # run integration tests (Mocha + VS Code, requires display)
pnpm run publish          # publish to VS Code Marketplace
pnpm run publish:openvsx  # publish to Open VSX Registry
```

Run a single unit test file: `pnpm run test:unit -- test/unit/cache.test.ts`
Run tests matching a name pattern: `pnpm run test:unit -- -t "should cache"`

Press **F5** in VS Code to launch the Extension Development Host.

## Source Structure

```
src/
  extension.ts                  # activation entry point
  managers/
    ExtensionManager.ts         # lifecycle coordinator
    ContextMenuManager.ts       # command registration & all handlers
    CommandRegistry.ts
  commands/
    BaseCommandHandler.ts
    ICommandHandler.ts
    CopyFunctionCommand.ts
    SaveAllCommand.ts
    OpenInTerminalCommand.ts
  services/
    codeAnalysisService.ts      # AST-based function detection (@babel/parser) - lazy-loaded
    configurationService.ts
    fileDiscoveryService.ts
    fileSaveService.ts
    terminalService.ts
    projectDetectionService.ts
    accessibilityService.ts
    enumGeneratorService.ts     # lazy-loaded
    envFileGeneratorService.ts  # lazy-loaded
    cronJobTimerGeneratorService.ts  # lazy-loaded
    fileNamingConventionService.ts
  di/
    container.ts                # DI container (singleton pattern)
    types.ts                    # DI token constants
    interfaces/                 # all service interfaces
  types/
    config.ts
    extension.ts
    vscode.ts
  utils/
    logger.ts
    cache.ts
    accessibilityHelper.ts
    configValidator.ts
    metrics.ts
    pathValidator.ts
public/                         # packaged extension assets (images, screenshots)
test/
  __mocks__/vscode.ts           # minimal vscode mock for Vitest unit tests
  unit/                         # Vitest unit tests (infrastructure, no VS Code API)
  suite/                        # Mocha integration tests (feature-level, live VS Code)
  fixtures/                     # test fixture files (sample.ts, package.json files)
  runTests.ts                   # @vscode/test-electron launcher
vitest.config.ts                # Vitest config (aliases vscode to mock)
tsconfig.test.json              # TypeScript config for compiling integration tests
```

## Canonical Sources

- **`package.json` `contributes`** — canonical source for all command IDs, settings, and keybindings (VS Code loads it directly).
- **`README.md`** — canonical user-facing narrative.
- **`CLAUDE.md`** — canonical architecture and dev conventions.
- **`ARCHITECTURE.md`** — technical documentation and architectural decisions.

## Services

### User-Facing Features (13)

These are the commands users interact with. `package.json` `contributes.commands` is the canonical command-ID list.

| Feature                   | Command ID                                    |
| ------------------------- | --------------------------------------------- |
| Copy Function             | `additionalContextMenus.copyFunction`         |
| Copy Function to File     | `additionalContextMenus.copyFunctionToFile`   |
| Move Function to File     | `additionalContextMenus.moveFunctionToFile`   |
| Copy Selection to File    | `additionalContextMenus.copySelectionToFile`  |
| Move Selection to File    | `additionalContextMenus.moveSelectionToFile`  |
| Save All                  | `additionalContextMenus.saveAll`              |
| Open in Terminal          | `additionalContextMenus.openInTerminal`       |
| Rename File to Convention | `additionalContextMenus.renameFileConvention` |
| Generate Enum             | `additionalContextMenus.generateEnum`         |
| Generate Cron Expression  | `additionalContextMenus.generateCronTimer`    |
| Generate .env File        | `additionalContextMenus.generateEnvFile`      |
| Copy File Contents        | `additionalContextMenus.copyFileContents`     |
| Duplicate File            | `additionalContextMenus.duplicateFile`        |

### Infrastructure Services (5)

These power the features internally.

| Service                 | Source File                               | Purpose                                               |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------- |
| CodeAnalysisService     | `src/services/codeAnalysisService.ts`     | AST-based function detection via @babel/parser        |
| FileDiscoveryService    | `src/services/fileDiscoveryService.ts`    | Workspace file scanning and compatible-file filtering |
| ConfigurationService    | `src/services/configurationService.ts`    | VS Code settings access and change events             |
| ProjectDetectionService | `src/services/projectDetectionService.ts` | Framework detection and context variable updates      |
| AccessibilityService    | `src/services/accessibilityService.ts`    | Screen reader announcements and ARIA helpers          |

## Commands Reference

### Right-Click Menu Only (hidden from Command Palette)

| Command ID                                   | Title                         | Keybinding         | File Type Restriction             |
| -------------------------------------------- | ----------------------------- | ------------------ | --------------------------------- |
| `additionalContextMenus.copyFunction`        | Copy Function                 | `Ctrl+Alt+Shift+F` | `.ts .tsx .js .jsx`               |
| `additionalContextMenus.copyFunctionToFile`  | Copy Function to File         | `Ctrl+Alt+Shift+E` | `.ts .tsx .js .jsx`               |
| `additionalContextMenus.moveFunctionToFile`  | Move Function to File         | `Ctrl+Alt+Shift+R` | `.ts .tsx .js .jsx`               |
| `additionalContextMenus.copySelectionToFile` | Copy Selection to File        | `Ctrl+Alt+Shift+C` | `.ts .tsx .js .jsx`               |
| `additionalContextMenus.moveSelectionToFile` | Move Selection to File        | `Ctrl+Alt+Shift+M` | `.ts .tsx .js .jsx`               |
| `additionalContextMenus.generateEnum`        | Generate Enum from Union Type | —                  | `.ts .tsx`                        |
| `additionalContextMenus.generateCronTimer`   | Generate Cron Expression      | —                  | -                                 |
| `additionalContextMenus.copyFileContents`    | Copy File Contents            | —                  | — (all file types, explorer only) |
| `additionalContextMenus.duplicateFile`       | Duplicate File                | —                  | — (all file types, explorer only) |

### Command Palette Accessible

| Command ID                                        | Title                      | Keybinding         |
| ------------------------------------------------- | -------------------------- | ------------------ |
| `additionalContextMenus.saveAll`                  | Save All                   | `Ctrl+Alt+Shift+A` |
| `additionalContextMenus.openInTerminal`           | Open in Terminal           | `Ctrl+Alt+Shift+T` |
| `additionalContextMenus.enable`                   | Enable                     | —                  |
| `additionalContextMenus.disable`                  | Disable                    | —                  |
| `additionalContextMenus.showOutputChannel`        | Show Output Channel        | —                  |
| `additionalContextMenus.debugContextVariables`    | Debug Context Variables    | —                  |
| `additionalContextMenus.refreshContextVariables`  | Refresh Context Variables  | —                  |
| `additionalContextMenus.checkKeybindingConflicts` | Check Keybinding Conflicts | —                  |
| `additionalContextMenus.enableKeybindings`        | Enable Keybindings         | —                  |
| `additionalContextMenus.disableKeybindings`       | Disable Keybindings        | —                  |
| `additionalContextMenus.renameFileConvention`     | Rename File to Convention  | —                  |
| `additionalContextMenus.generateEnvFile`          | Generate .env File         | —                  |

## Key Design Decisions

### Copy Function / Copy Function to File / Move Function to File

- Only works on `.ts`, `.tsx`, `.js`, `.jsx` files — enforced in both `package.json` `when` clauses (keybindings + context menu) and at runtime via `isSupportedFileType()` in `ContextMenuManager`
- Uses `codeAnalysisService.findFunctionAtPosition()` for AST-based detection
- **Copy Function to File** and **Move Function to File** insert only the raw function text — no import copying. Uses `insertFunctionIntoFile()` (smart insertion point: after imports, before exports)
- **Copy Selection to File** and **Move Selection to File** do copy imports (merge strategy configurable via settings)

### Copy Selection to File / Move Selection to File

- Previously named `copyContentToFile` / `moveContentToFile` — renamed in v2.0.0 (breaking change)
- Old command IDs no longer exist

### Function Detection (`codeAnalysisService.ts`)

- `findFunctionNodeContainingPosition`: for `VariableStatement` nodes (e.g. `const foo = () => {}`), extracts the inner `ArrowFunction`/`FunctionExpression` initializer — never casts `VariableStatement` to `FunctionLike`
- `extractFunctionInfo`: when the node's parent chain is `VariableDeclaration → VariableDeclarationList → VariableStatement`, uses the `VariableStatement` as the text boundary to capture the full `const foo = () => {}` declaration
- `getFunctionName`: reads name from `node.parent` (`VariableDeclaration`) for arrow/function expressions

### Command Handler Pattern

Two patterns coexist — do not mix them when adding new commands:

- **Class-based (`src/commands/`)**: `CopyFunctionCommand`, `SaveAllCommand`, `OpenInTerminalCommand` each implement `ICommandHandler` with a `BaseCommandHandler` base class. Use this for commands with complex logic or standalone testability needs.
- **Inline handlers (`ContextMenuManager`)**: All other commands (selection/function-to-file moves, generator commands, `copyFileContents`, `duplicateFile`) are implemented as private `handle*` methods directly in `ContextMenuManager`. Use this for simpler commands.

New commands should follow the inline pattern unless the logic is substantial enough to warrant a separate class.

### DI Container Pattern

- All services are singletons, registered in `src/di/container.ts` via `container.registerSingleton(TYPES.Token, factory)`
- Services are instantiated via static factory methods (`ServiceName.create(...)`) or `ServiceName.getInstance()` — not `new ServiceName()`
- DI tokens are `symbol` constants defined in `src/di/types.ts`; interfaces live in `src/di/interfaces/`
- Generator services (`enumGeneratorService`, `envFileGeneratorService`, `cronJobTimerGeneratorService`) are **not** registered in the container at startup — they are dynamically imported in `ContextMenuManager` on first use
- `codeAnalysisService` is registered in the DI container but loads lazily: the `registerSingleton` factory calls `require(dist/lazy/codeAnalysisService.js)` on first invocation, deferring the @babel/parser load until the first Copy/Move Function command
- Child containers (`container.createChild()`) are supported for test isolation

### Lazy Loading

- `codeAnalysisService`, `enumGeneratorService`, `envFileGeneratorService`, `cronJobTimerGeneratorService` are loaded at runtime from `dist/lazy/` via `require()` — not bundled in the core bundle
- esbuild treats them as externals during the main bundle and builds them as separate entry points under `dist/lazy/`
- **Bundle size targets (production only):** core bundle <= 100KB — enforced with a warning in esbuild.config.ts. codeAnalysisService.js bundles @babel/parser + @babel/types; lazy total target is advisory only.

### Context Variable

- `additionalContextMenus.isInFunction` — set on every cursor move; controls visibility of Copy/Move Function to File in the context menu

## Settings Reference

| Key                                                       | Type    | Default                       | Description                                                 |
| --------------------------------------------------------- | ------- | ----------------------------- | ----------------------------------------------------------- |
| `additionalContextMenus.enabled`                          | boolean | `true`                        | Enable/disable the extension                                |
| `additionalContextMenus.autoDetectProjects`               | boolean | `true`                        | Auto-detect frameworks                                      |
| `additionalContextMenus.supportedExtensions`              | array   | `[".ts",".tsx",".js",".jsx"]` | File extensions for context menus                           |
| `additionalContextMenus.copyCode.insertionPoint`          | enum    | `"smart"`                     | `smart` / `end` / `beginning`                               |
| `additionalContextMenus.copyCode.preserveComments`        | boolean | `true`                        | Preserve comments when copying                              |
| `additionalContextMenus.saveAll.showNotification`         | boolean | `true`                        | Show notification after Save All                            |
| `additionalContextMenus.saveAll.skipReadOnly`             | boolean | `true`                        | Skip read-only files                                        |
| `additionalContextMenus.terminal.type`                    | enum    | `"integrated"`                | `integrated` / `external` / `system-default`                |
| `additionalContextMenus.terminal.externalTerminalCommand` | string  | `""`                          | Custom terminal command (use `{{directory}}`)               |
| `additionalContextMenus.terminal.openBehavior`            | enum    | `"parent-directory"`          | `parent-directory` / `workspace-root` / `current-directory` |
| `additionalContextMenus.accessibility.verbosity`          | enum    | `"normal"`                    | `minimal` / `normal` / `verbose`                            |
| `additionalContextMenus.accessibility.screenReaderMode`   | boolean | `false`                       | Enhanced screen reader support                              |
| `additionalContextMenus.accessibility.keyboardNavigation` | boolean | `true`                        | Show keyboard hints in Quick Pick                           |
| `additionalContextMenus.fileDiscovery.cacheTTL`           | number  | `300000`                      | File discovery cache TTL in ms (0 = disabled)               |

## Release & Versioning Strategy

This project follows [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html). Pre-release vs stable is determined by **tag suffix only** — minor versions have no parity meaning.

### Automation Layout

- `.github/workflows/ci.yml` runs PR/main quality gates: cache warmup, lint, unit coverage, integration tests, and build (Ubuntu × Node 22/24/26 × VS Code stable). The unit-coverage job uploads `coverage/lcov.info` to Codecov (`codecov/codecov-action@v5`, `fail_ci_if_error: false`) — requires a `CODECOV_TOKEN` repo secret to actually publish; the coverage badge in `README.md` and `codecov.yml` (informational-only status checks) are wired regardless.
- `.github/workflows/security-pr.yml` runs PR/main security gates: `pnpm audit --audit-level=high` and dependency review on PRs.
- `.github/workflows/security-daily.yml` runs daily/manual/package-change security audits (via both `pnpm audit` and the GitHub Dependabot Alerts API, requiring `security-events: read` permission), outdated-package summaries, artifact uploads, and triage issue creation for critical/high findings or workflow failures. When `security-audit` finds critical/high vulnerabilities via either `pnpm audit` or Dependabot alerts, a follow-up `security-remediate` job runs `.github/scripts/security-remediate-agent.mjs` — an OpenAI-SDK tool-calling agent that reconciles with open Dependabot PRs and attempts a real fix, opening a PR against `main` only after the script (not the agent) independently re-verifies the audit improved and build+tests still pass. The remediation agent includes a `list_dependabot_alerts` tool alongside its existing Dependabot-PR tools, enabling it to act on alert-only findings that `pnpm audit` doesn't surface. Requires an `OPENAI_API_KEY` secret and `OPENAI_MODEL_DEFAULT` repo variable to be configured before this job can run. `execCapture` (the script's process-spawning helper) strips `OPENAI_API_KEY`/`GH_TOKEN` from the environment of every spawned command by default — they're threaded back in explicitly only for the specific `gh` calls that need them.
- `.github/workflows/codeql.yml` runs CodeQL static analysis (JavaScript/TypeScript, `security-extended` queries) on PRs/pushes to `main` and weekly, uploading results to the Security → Code scanning tab.
- `.github/workflows/scorecard.yml` runs the OpenSSF Scorecard supply-chain posture check on pushes to `main` and weekly, uploading SARIF results to the Security tab.
- `.github/workflows/release.yml` runs when a maintainer publishes a GitHub Release (`release: published`). Merges to `main`, pushed tags and `package.json` changes never publish. The `setup` job runs `.github/scripts/release-gate.sh` before any build: the tag must be `v<package.json version at the tag>`, reachable from `main`, and the release's pre-release flag must match the version suffix. The VSIX is attached to the existing release; the workflow does not tag or release anything itself.
- `.github/workflows/pr-title.yml` lints PR titles with the repo commitlint config. Merges into `main` are squash-only (repo settings and the `protect_default_branch` ruleset), the PR title and body become the commit, and head branches are deleted after merge.
- Community automation lives in `.github/workflows/stale.yml`, `.github/workflows/labels-sync.yml`, and `.github/workflows/all-contributors.yml`.
- Release publishing requires `VSCE_PAT` and `OVSX_PAT`.
- Codecov upload in `ci.yml` requires a `CODECOV_TOKEN` repo secret (optional — CI does not fail without it).

### How Release Detects Pre-release

The release gate derives the channel from the tag's version (`-rc`, `-next`, `-beta`, or `-alpha` suffix) and fails when it disagrees with the pre-release flag set on the GitHub Release:

```bash
if [[ $TAG =~ -(rc|next|beta|alpha) ]]; then
  is_prerelease=true
fi
```

- Pre-release versions → both marketplaces publish with `--pre-release`
- Stable versions → both marketplaces publish as stable
- Both publishes use `--skip-duplicate`, so re-running a release skips versions already live

### Release Checklist

1. Bump `package.json` version (e.g. `2.0.2`, `2.1.0-beta.1`, or `2.1.0` to graduate) in a PR and squash-merge it into `main`
2. GitHub → Releases → Draft a new release: choose new tag `v<version>` targeting `main`, click **Generate release notes** (uses `.github/release.yml`), set **Set as a pre-release** only for pre-release versions
3. Click **Publish release**. The workflow validates, builds, verifies, publishes to both marketplaces and attaches the VSIX

A draft release does not start the workflow. If a gate fails, nothing is published: delete the release, fix the tag, and publish again.

**Recovery (e.g. one marketplace was down):** Actions → Release → Run workflow with the existing release tag. Only logins in the repo variable `RELEASE_WHITELIST_ACTORS` (Settings → Secrets and variables → Actions → Variables, comma-separated) may run it. The check applies to whoever started or re-ran the run, and an empty variable fails the run. Keep `actions: write` out of every workflow's permissions, since `github-actions[bot]` is allowlisted.

A release created with `GITHUB_TOKEN` (e.g. by another workflow) does not trigger workflows; publish releases as a maintainer.

### Merge Policy

- Merge method is squash only. PR title becomes the commit subject, so it must pass commitlint (checked by `pr-title.yml`); PR body becomes the commit message
- Head branches are deleted automatically after merge

## Steps to Follow

- All new changes should be added to the `CLAUDE.md` file
- All new changes that are user viewable should be added to `public/` and `README.md`
- All new changes should be logged in the `CHANGELOG.md` file under unreleased section
- Community automation changes should update `AGENTS.md`, `CONTRIBUTING.md`, `.github/copilot-instructions.md`, and `THIRDPARTY.md` when commands, workflow ownership, or dependency notices change.
- Configuration or command behavior changes must update `package.json`, related types in `src/types/`, tests, and docs together.
- Third-party tooling changes must keep `THIRDPARTY.md` current.

## Commit & Branch Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(copy): add file contents command`
- `fix(fileDiscovery): respect cache ttl`
- `test(unit): cover enum generation`

**Commit size limits** (enforced by hooks and CI): max **10 files** and **400 changed lines** per commit. Sweeping refactors that exceed these limits may add the `size/override` label to the PR to bypass the CI hard-fail (warning comment is still posted).

Branch naming: `feature/`, `fix/`, `docs/`, or `refactor/` prefix from `main`.

## Test Conventions

- **Unit tests** (`test/unit/`, run with `pnpm run test:unit`): infrastructure utilities and services where VS Code API is mocked. No live VS Code instance required.
- **Coverage** (`pnpm run test:unit:coverage`): Vitest coverage output is written to `coverage/lcov.info`.
- **Integration tests** (`test/suite/`, run with `pnpm run test:integration`): feature-level tests that exercise the 13 user-facing commands end-to-end in a real VS Code Extension Development Host.
- **No separate E2E layer**: The integration suite already drives a real VS Code Extension Development Host, which is the canonical end-to-end layer for a VS Code extension. A separate `@vscode/test-web` layer is not warranted unless vscode.dev certification is required (out of scope for v2.0.x). Do not add a separate e2e folder.
- Integration test build output goes to `.out-test/` (not `dist/`). The script is `pnpm run test:integration`. Compile errors fail the build — `|| true` is not used in CI.
- Never add VS Code API-dependent logic to unit tests; never add pure-logic tests to the integration suite.
- On Linux CI, integration tests run under `xvfb-run -a`.
- All test descriptions must start with `"should "` (e.g. `it('should detect React', ...)`).
- Run integration tests before any change to context menus, commands, file operations, or editor interactions.

## Project Structure & Module Organization

This is a TypeScript VS Code extension. Source code lives in `src/`: command handlers in `src/commands/`, services in `src/services/`, dependency injection in `src/di/`, managers in `src/managers/`, shared types in `src/types/`, and helpers in `src/utils/`. Unit tests are in `test/unit/`, integration tests in `test/suite/`, mocks in `test/__mocks__/`, and fixtures in `test/fixtures/`. Packaged extension assets are in `public/`. Do not edit generated output in `dist/` or `.out-test/`.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies.
- `pnpm run build`: bundle the extension with esbuild.
- `pnpm run watch`: rebuild during extension development.
- `pnpm run lint`: run ESLint against `src/`.
- `pnpm run lint:fix`: apply automatic ESLint fixes.
- `pnpm run format`: format the repository with Prettier.
- `pnpm run test:unit`: run Vitest unit tests.
- `pnpm run test:unit:coverage`: run Vitest unit tests and produce `coverage/lcov.info`.
- `pnpm run test:integration`: compile tests and run VS Code integration tests.
- `pnpm run package`: create a `.vsix` package.

Use Node.js 22+ and pnpm. Development uses Node 24 LTS (`.nvmrc` = `lts/krypton`). For manual testing, open the repo in VS Code and press `F5`.

## Coding Style & Naming Conventions

Write TypeScript and keep modules focused by responsibility. Use PascalCase for classes and service files such as `FileDiscoveryService.ts`, camelCase for functions and variables, and command names matching package command IDs. Prettier handles formatting; ESLint enforces quality and security rules. Avoid committing compiled `.js` or `.js.map` files under `src/`, `test/`, or `scripts/`.

## Testing Guidelines

Add unit tests in `test/unit/*.test.ts` for services, utilities, and validators. Add integration tests in `test/suite/*.test.ts` when changes touch VS Code commands, context menus, file operations, or editor interactions. Use `test/fixtures/` when possible. Run integration tests before user-facing behavior changes.

## Commit & Pull Request Guidelines

Use Conventional Commits, for example `feat(copy): add file contents command`, `fix(fileDiscovery): respect cache ttl`, or `test(unit): cover enum generation`. Hooks and CI enforce a maximum of 10 files and 400 changed lines per commit. Sweeping refactors may add the `size/override` label to the PR to bypass the CI hard-fail. Branch from `main` using prefixes such as `feature/`, `fix/`, `docs/`, or `refactor/`.

Pull requests should include a clear description, linked issues when applicable, and screenshots or recordings for visible VS Code UI changes. Before opening a PR, run `pnpm run lint`, `pnpm run build`, and relevant tests. CI warms `node_modules` caches for Node 22/24/26; security workflows run high-severity `pnpm audit`, PR dependency review, and daily/manual audit summaries. Workflow or community automation changes should also update `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `CONTRIBUTING.md`, and `.github/copilot-instructions.md` when commands or maintainer procedures change.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for full technical documentation.

## Security & Configuration Tips

Do not commit secrets, local VS Code state, generated packages, coverage output, or build artifacts. Review `SECURITY.md` for vulnerability reporting. Configuration changes should update `package.json`, related types in `src/types/`, and tests together. Third-party tooling changes should keep `THIRDPARTY.md` current.
