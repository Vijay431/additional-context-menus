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
pnpm run clean            # remove dist/, out-test/ and *.vsix
pnpm run rebuild          # clean + build + package
pnpm run package          # production build (.vsix)
pnpm run lint             # Biome lint + format check
pnpm run lint:fix         # Biome safe fixes
pnpm run lint:md          # markdownlint
pnpm run typecheck        # tsc --noEmit for src and tests
pnpm run format           # Biome format
pnpm run check:prerelease # fail on prerelease direct dependencies
pnpm run smoke:bundle     # load the production bundle outside VS Code
pnpm run test:unit        # run unit tests (Vitest)
pnpm run test:unit:coverage # run unit tests with LCOV coverage
pnpm run test:integration # run integration tests (@vscode/test-cli, requires display; use xvfb-run -a on Linux)
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
vitest.config.ts                # Vitest config (aliases vscode to mock)
tsconfig.test.json              # TypeScript config for compiling integration tests
.vscode-test.mjs                # @vscode/test-cli config (files, Mocha options)
```

## Canonical Sources

- **`package.json` `contributes`** — canonical source for all command IDs, settings, and keybindings (VS Code loads it directly).
- **`README.md`** — canonical user-facing narrative.
- **`AGENTS.md`** — dev conventions and commands for contributors and AI assistants.
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

- `.github/workflows/ci.yml` runs PR/main quality gates: Biome lint, markdownlint, typecheck, commitlint (PR commits and title), unit coverage, integration tests under `xvfb-run -a`, `pnpm audit`, dependency review (PRs), a bundle smoke test, and a build matrix (Ubuntu, Windows, macOS × Node 22/24/26 × VS Code stable/insiders). The unit-coverage job uploads `coverage/lcov.info` to Codecov (`fail_ci_if_error: false`) and needs a `CODECOV_TOKEN` repo secret to publish.
- `.github/workflows/security-daily.yml` runs daily, on manual dispatch, and on `package.json`/`pnpm-lock.yaml` changes on `main`. It audits with `pnpm audit` and the Dependabot Alerts API (needs `security-events: read`), summarizes outdated packages, uploads artifacts, and opens or updates one triage issue for critical or high findings.
- `.github/workflows/codeql.yml` runs CodeQL (JavaScript/TypeScript, `security-extended`) on PRs and pushes to `main` and weekly.
- `.github/workflows/scorecard.yml` runs the OpenSSF Scorecard check on pushes to `main` and weekly, uploading SARIF to the Security tab.
- `.github/workflows/release.yml` runs when a `v*` tag is pushed. Merges to `main` and `package.json` changes never publish. The `gate` job runs `.github/scripts/release-gate.sh` before any build: the tag must match `v<major>.<minor>.<patch>[-suffix]`, equal `package.json` `version` at the tagged commit, and be reachable from `main`. Then it verifies, publishes to both marketplaces, attests the `.vsix` build provenance, and attaches the `.vsix` to the GitHub Release.
- Community automation lives in `.github/workflows/labels-sync.yml` and `.github/workflows/all-contributors.yml`.
- Every workflow action is pinned to a commit SHA; Dependabot keeps the pins current.
- Release publishing requires `VSCE_PAT` and `OVSX_PAT`.

### How Release Detects Pre-release

The release gate derives the channel from the tag's version (`-rc`, `-next`, `-beta`, or `-alpha` suffix):

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
2. Update `CHANGELOG.md`, then tag the merge commit: `git tag v<version> && git push origin v<version>`
3. The workflow validates, builds, verifies, publishes to both marketplaces, attests the VSIX, and creates the GitHub Release with the VSIX attached

If a gate fails, nothing is published: delete the tag, fix the problem, and tag again.

**Recovery (e.g. one marketplace was down):** Actions → Release → Run workflow with the existing tag. Only logins in the repo variable `RELEASE_WHITELIST_ACTORS` (Settings → Secrets and variables → Actions → Variables, comma-separated) may run it manually. The run builds from the tag, skips versions already published, and replaces assets on an existing GitHub Release.

### Merge Policy

- Squash-merge PRs into `main`. PR title becomes the commit subject, so it must pass commitlint (checked by the `commitlint` job in `ci.yml`); use the PR body as the commit message
- Head branches are deleted automatically after merge

## Steps to Follow

- All new changes that are user viewable should be added to `public/` and `README.md`
- All new changes should be logged in the `CHANGELOG.md` file under unreleased section
- Community automation changes should update `AGENTS.md`, `CONTRIBUTING.md`, and `THIRDPARTY.md` when commands, workflow ownership, or dependency notices change.
- Configuration or command behavior changes must update `package.json`, related types in `src/types/`, tests, and docs together.
- Third-party tooling changes must keep `THIRDPARTY.md` current.

## Commit & Branch Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(copy): add file contents command`
- `fix(fileDiscovery): respect cache ttl`
- `test(unit): cover enum generation`

Husky runs Biome and markdownlint on staged files and commitlint on the message.

Branch naming: `feature/`, `fix/`, `docs/`, or `refactor/` prefix from `main`.

## Test Conventions

- **Unit tests** (`test/unit/`, run with `pnpm run test:unit`): infrastructure utilities and services where VS Code API is mocked. No live VS Code instance required.
- **Coverage** (`pnpm run test:unit:coverage`): Vitest coverage output is written to `coverage/lcov.info`.
- **Integration tests** (`test/suite/`, run with `pnpm run test:integration`): feature-level tests that exercise the 13 user-facing commands end-to-end in a real VS Code Extension Development Host.
- **No separate E2E layer**: The integration suite already drives a real VS Code Extension Development Host, which is the canonical end-to-end layer for a VS Code extension. A separate `@vscode/test-web` layer is not warranted unless vscode.dev certification is required (out of scope for v2.0.x). Do not add a separate e2e folder.
- Integration test build output goes to `out-test/` (not `dist/`) and runs through `@vscode/test-cli` (`.vscode-test.mjs`). The script is `pnpm run test:integration`. Compile errors fail the build — `|| true` is not used in CI.
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
- `pnpm run lint`: run Biome (lint and format check).
- `pnpm run lint:fix`: apply Biome safe fixes.
- `pnpm run lint:md`: run markdownlint.
- `pnpm run typecheck`: TypeScript type checking (no emit).
- `pnpm run format`: format the repository with Biome.
- `pnpm run test:unit`: run Vitest unit tests.
- `pnpm run test:unit:coverage`: run Vitest unit tests and produce `coverage/lcov.info`.
- `pnpm run test:integration`: compile tests and run VS Code integration tests.
- `pnpm run package`: create a `.vsix` package.

Use Node.js 22+ and pnpm. Development uses Node 24 LTS (`.nvmrc` = `lts/krypton`). For manual testing, open the repo in VS Code and press `F5`.

## Coding Style & Naming Conventions

Write TypeScript and keep modules focused by responsibility. Use PascalCase for classes and service files such as `FileDiscoveryService.ts`, camelCase for functions and variables, and command names matching package command IDs. Biome handles linting and formatting. Avoid committing compiled `.js` or `.js.map` files under `src/`, `test/`, or `scripts/`.

## Testing Guidelines

Add unit tests in `test/unit/*.test.ts` for services, utilities, and validators. Add integration tests in `test/suite/*.test.ts` when changes touch VS Code commands, context menus, file operations, or editor interactions. Use `test/fixtures/` when possible. Run integration tests before user-facing behavior changes.

## Commit & Pull Request Guidelines

Use Conventional Commits, for example `feat(copy): add file contents command`, `fix(fileDiscovery): respect cache ttl`, or `test(unit): cover enum generation`. Husky runs commitlint on every commit message. Branch from `main` using prefixes such as `feature/`, `fix/`, `docs/`, or `refactor/`.

Pull requests should include a clear description, linked issues when applicable, and screenshots or recordings for visible VS Code UI changes. Before opening a PR, run `pnpm run lint`, `pnpm run lint:md`, `pnpm run typecheck`, `pnpm run build`, and relevant tests. CI runs `pnpm audit` and dependency review on PRs; `security-daily.yml` runs daily audit summaries. Workflow or community automation changes should also update `README.md`, `CHANGELOG.md` and `CONTRIBUTING.md` when commands or maintainer procedures change.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for full technical documentation.

## Security & Configuration Tips

Do not commit secrets, local VS Code state, generated packages, coverage output, or build artifacts. Review `SECURITY.md` for vulnerability reporting. Configuration changes should update `package.json`, related types in `src/types/`, and tests together. Third-party tooling changes should keep `THIRDPARTY.md` current.
