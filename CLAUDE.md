# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file is the single source of truth for the **Additional Context Menus** VS Code extension. Update it whenever architecture, commands, or conventions change.

---

## Project Overview

- **Name:** Additional Context Menus
- **Publisher:** VijayGangatharan
- **Version:** 2.1.0
- **VS Code engine:** >=1.111.0 (last 10 minor versions; 1.111–1.120)
- **Node.js:** >=22 runtime (22, 24, 26 supported); dev uses Node 24 LTS (`lts/jod`)
- **Package manager:** pnpm (`pnpm-workspace.yaml` owns `overrides` and `allowBuilds`; do not put them in `package.json`)
- **Language:** TypeScript (strict mode)
- **Bundle tool:** esbuild (via `esbuild.config.ts`)
- **Published to:** VS Code Marketplace and Open VSX Registry

---

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

---

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
    codeAnalysisService.ts      # AST-based function detection (TypeScript Compiler API)
    configurationService.ts
    fileDiscoveryService.ts
    fileSaveService.ts
    terminalService.ts
    projectDetectionService.ts
    accessibilityService.ts
    codeAnalysisService.ts      # lazy-loaded (bundles TypeScript compiler)
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

---

## Services

### Canonical Sources

- **`package.json` `contributes`** — canonical source for all command IDs, settings, and keybindings (VS Code loads it directly).
- **`README.md`** — canonical user-facing narrative.
- **`CLAUDE.md`** — canonical architecture and dev conventions.
- **`ARCHITECTURE.md`** — technical documentation and architectural decisions.

### Architecture Diagrams

**Runtime Architecture**

```mermaid
flowchart TD
    A["extension"] --> B["ExtensionManager"]
    B --> C["ContextMenuManager"]
    C --> D["FileSaveService\nSave All"]
    C --> E["TerminalService\nOpen in Terminal"]
    C --> F["FileNamingConventionService\nRename to Convention"]
    C --> G["Copy, Move, Duplicate handlers\nFunction, Selection, File"]
    C -.->|"lazy load"| H["EnumGeneratorService\nGenerate Enum"]
    C -.->|"lazy load"| I["EnvFileGeneratorService\nGenerate .env File"]
    C -.->|"lazy load"| J["CronJobTimerGeneratorService\nGenerate Cron"]
```

**Codebase Structure**

```mermaid
flowchart TD
    A["extension"] --> B["managers"]
    B --> C["di\ncontainer, interfaces"]
    C --> D["Feature Services\nFileSaveService\nTerminalService\nFileNamingConventionService"]
    C -.->|"lazy load"| L["Lazy Services\nEnumGeneratorService\nEnvFileGeneratorService\nCronJobTimerGeneratorService"]
    D --> E["utils, types"]
    L --> E
```

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

| Service                 | Source File                               | Purpose                                                  |
| ----------------------- | ----------------------------------------- | -------------------------------------------------------- |
| CodeAnalysisService     | `src/services/codeAnalysisService.ts`     | AST-based function detection via TypeScript Compiler API |
| FileDiscoveryService    | `src/services/fileDiscoveryService.ts`    | Workspace file scanning and compatible-file filtering    |
| ConfigurationService    | `src/services/configurationService.ts`    | VS Code settings access and change events                |
| ProjectDetectionService | `src/services/projectDetectionService.ts` | Framework detection and context variable updates         |
| AccessibilityService    | `src/services/accessibilityService.ts`    | Screen reader announcements and ARIA helpers             |

---

## Commands

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

---

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
- `codeAnalysisService` is registered in the DI container but loads lazily: the `registerSingleton` factory calls `require(dist/lazy/codeAnalysisService.js)` on first invocation, deferring the TypeScript compiler load until the first Copy/Move Function command
- Child containers (`container.createChild()`) are supported for test isolation

### Lazy Loading

- `codeAnalysisService`, `enumGeneratorService`, `envFileGeneratorService`, `cronJobTimerGeneratorService` are loaded at runtime from `dist/lazy/` via `require()` — not bundled in the core bundle
- esbuild treats them as externals during the main bundle and builds them as separate entry points under `dist/lazy/`
- **Bundle size targets (production only):** core bundle ≤ 100KB — enforced with a warning in `esbuild.config.ts`. `codeAnalysisService.js` alone is ~3.4MB (bundles the TypeScript compiler); lazy total target is advisory only.

### Context Variable

- `additionalContextMenus.isInFunction` — set on every cursor move; controls visibility of Copy/Move Function to File in the context menu

---

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

- `.github/workflows/ci.yml` runs PR/main quality gates: cache warmup, lint, unit coverage, integration tests, and build (Ubuntu × Node 22/24/26 × VS Code stable).
- `.github/workflows/security-pr.yml` runs PR/main security gates: `pnpm audit --audit-level=high` and dependency review on PRs.
- `.github/workflows/security-daily.yml` runs daily/manual/package-change security audits, outdated-package summaries, artifact uploads, and triage issue creation for critical/high findings or workflow failures.
- `.github/workflows/release.yml` runs only on `v*` tag pushes: package, verify, publish to VS Code Marketplace and Open VSX, and create a GitHub Release.
- Community automation lives in `.github/workflows/stale.yml`, `.github/workflows/labels-sync.yml`, and `.github/workflows/all-contributors.yml`.
- Release publishing requires `VSCE_PAT` and `OVSX_PAT`.

### How Release Detects Pre-release

The release workflow `setup` job checks the tag for `-rc`, `-next`, `-beta`, or `-alpha`:

```bash
if echo "$VERSION" | grep -qE '\-(rc|next|beta|alpha)'; then
  echo "is_prerelease=true"
fi
```

- Pre-release tags → both marketplaces publish with `--pre-release`
- Stable tags → both marketplaces publish as stable

### Release Checklist

**Stable patch release (`v2.0.2`):**

1. Ensure `package.json` version is `2.0.2`
2. Push tag: `git tag v2.0.2 && git push origin v2.0.2`
3. Release workflow publishes to VS Code Marketplace + Open VSX, creates GitHub Release

**Pre-release (`v2.1.0-beta.1`):**

1. Bump `package.json` version to `2.1.0`
2. Push tag: `git tag v2.1.0-beta.1 && git push origin v2.1.0-beta.1`
3. Release workflow publishes with `--pre-release` to both marketplaces

**Graduating pre-release to stable (`v2.1.0`):**

1. `package.json` already says `2.1.0` — no change needed
2. Push tag: `git tag v2.1.0 && git push origin v2.1.0`
3. Release workflow publishes stable to both marketplaces

---

## Steps to follow:

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

## Test Conventions:

- **Unit tests** (`test/unit/`, run with `pnpm run test:unit`): infrastructure utilities and services where VS Code API is mocked. No live VS Code instance required.
- **Coverage** (`pnpm run test:unit:coverage`): Vitest coverage output is written to `coverage/lcov.info`.
- **Integration tests** (`test/suite/`, run with `pnpm run test:integration`): feature-level tests that exercise the 13 user-facing commands end-to-end in a real VS Code Extension Development Host.
- **No separate E2E layer**: The integration suite already drives a real VS Code Extension Development Host, which is the canonical end-to-end layer for a VS Code extension. A separate `@vscode/test-web` layer is not warranted unless vscode.dev certification is required (out of scope for v2.0.x). Do not add a separate e2e folder.
- Integration test build output goes to `out-test/` (not `dist/`). The script is `pnpm run test:integration`. Compile errors fail the build — `|| true` is not used in CI.
- Never add VS Code API-dependent logic to unit tests; never add pure-logic tests to the integration suite.
- On Linux CI, integration tests run under `xvfb-run -a`.
- All test descriptions must start with `"should "` (e.g. `it('should detect React', ...)`).
- Run integration tests before any change to context menus, commands, file operations, or editor interactions.

---

## Assistant Conventions

### Communication

Default to **caveman mode** (terse: drop articles/filler/pleasantries; fragments OK). Keep technical substance exact. Code/commits/PRs/security warnings stay in normal English. Disable on request ("normal mode").

### Shell commands

Prepend `rtk` to all shell invocations when available — 60-90% token savings on dev ops. Examples: `rtk git status`, `rtk pnpm test`, `rtk ls`. Fallback to direct command if `rtk` unavailable, or for compound predicates (`find -not`, `find -exec`) which rtk does not support.
