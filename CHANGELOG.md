# Changelog

All notable changes to the "Additional Context Menus" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **CI packaging dry-run**: `build` job now runs `pnpm run package` (`vsce package`) after the build step, across the Node 22/24/26 matrix — validates the VSIX packaging pipeline on every PR/main run instead of only at release time. No upload/publish occurs.

### Fixed
- Daily security audit workflow now manages a single tracking issue instead of creating duplicate issues each day; resolves all 41 stale bot-generated security alert issues
- Updated CLAUDE.md to correctly document that `codeAnalysisService` uses `@babel/parser` (not TypeScript Compiler API)
- **Security audit remediation**: Tightened pnpm overrides for `js-yaml` (`>=4.1.2` → `>=5.2.2`) and `brace-expansion` (`>=5.0.6` → `>=5.0.8`) — the prior ranges were resolving to vulnerable versions (`js-yaml@5.2.1`, `brace-expansion@5.0.7`) because they only set a floor without excluding the vulnerable window. `pnpm audit --audit-level=low` now reports zero vulnerabilities.
- **Security audit remediation**: Tightened pnpm overrides for `undici` (`>=7.28.0` → `>=8.9.0`), `fast-uri` (`>=3.1.2` → `>=4.1.2`), and `postcss` (`>=8.5.10` → `>=8.5.23`) — the prior ranges were resolving to vulnerable versions (`undici@8.7.0`, `fast-uri@4.1.1`, `postcss@8.5.19`) because they only set a floor without excluding the vulnerable window. `pnpm audit --audit-level=low` now reports zero vulnerabilities.
- **Security audit remediation**: Added pnpm override for `nanoid` (`>=3.3.17 <4`) — transitive dependency of `postcss` (via `vite`/`vitest`) resolved to the vulnerable `nanoid@3.3.16` (GHSA-2v37-7h3g-55p8, high severity: custom generators can loop indefinitely when size is zero). The range is capped below `4` because `nanoid` v4+ dropped CommonJS support and an unbounded `>=3.3.17` override resolved to `nanoid@6.0.1`, which is incompatible with `postcss`'s `^3.3.7` requirement. `pnpm audit --audit-level=low` now reports zero vulnerabilities.

## [2.1.3] - 2026-07-20

### Changed

- **Dependency updates (Dependabot PRs #270, #271, #273, #275, #276, #278, #279, #280, #281, #282, #283, #287, #307, #308)**: Updated dev dependencies and GitHub Actions to latest versions.
  - npm packages: `@commitlint/cli` ^21.0.2, `@commitlint/config-conventional` ^21.0.2, `@typescript-eslint/eslint-plugin` ^8.60.1, `@typescript-eslint/parser` ^8.60.1, `@vitest/coverage-v8` 4.1.8, `@vscode/vsce` ^3.9.2, `concurrently` ^10.0.3, `eslint` ^10.4.1, `eslint-plugin-prettier` ^5.5.6, `lint-staged` ^17.0.7, `ovsx` ^1.0.0, `typescript-eslint` ^8.60.1, `vitest` 4.1.8.
  - GitHub Actions: `actions/checkout` v5→v7, `actions/cache` v5→v6, `marocchino/sticky-pull-request-comment` v2→v3, `softprops/action-gh-release` v2→v3.
- **Security audit remediation**: Added pnpm overrides for vulnerable dev-only transitive dependencies (`shell-quote`, `tmp`, `form-data`, `undici`, `js-yaml`, `vite`) and regenerated `pnpm-lock.yaml` so `pnpm audit` reports zero vulnerabilities. `esbuild` is bumped directly in `package.json` since it's a direct devDependency.

### Fixed

- Removed a redundant type assertion in `ProjectDetectionService.getFrameworks()`.
- **vsce packaging**: Removed `linkify-it` and `markdown-it` pnpm overrides that forced ESM-only `linkify-it@6` into `vsce`'s CommonJS dependency tree, causing `linkify_it.default is not a constructor` at `vsce package` time. These packages are dev-only transitive dependencies of `@vscode/vsce` and are not included in the published VSIX bundle.

## [2.1.2]

### Changed

- Disabled npm audit and funding messages in `.npmrc`.

## [2.1.1]

### Added

- **Architecture diagrams**: Mermaid runtime architecture and codebase structure diagrams added to `README.md`, `CLAUDE.md`, and `AGENTS.md`. Diagrams show the core user-facing feature services only.
- **`pricing` and `qna` marketplace fields**: Declared `"pricing": "Free"` and `"qna": "marketplace"` in `package.json` for a clearer, more complete marketplace listing.
- **Security workflows**: Added separate PR and daily security workflows. PRs run high-severity `pnpm audit` plus dependency review; daily/manual/package-change runs summarize audit and outdated-package status, upload artifacts, and open triage issues for critical/high findings or workflow failure.

### Changed

- **CI dependency caching**: CI now warms and restores `node_modules` caches for Node 22/24/26, runs lint/unit/integration checks from the shared Node 22 cache, and keeps the build matrix across the supported Node range.
- **CI build matrix simplified**: Build job now runs Ubuntu-only with VS Code stable across Node 22/24/26. Removed Windows, macOS, and VS Code Insiders matrix dimensions to reduce CI cost and noise.
- **Removed GitHub Pages site**: Deleted the `docs/` Jekyll site in favour of `README.md` as the single user-facing source. All `vijay431.github.io` links removed across the codebase.
- **Single source of truth established**: `package.json` `contributes` is canonical for command/setting/keybinding metadata; `README.md` is canonical for user-facing narrative; `CLAUDE.md` is canonical for architecture and dev conventions.
- **package.json scripts**: Removed `docs:serve` and `docs:live`; simplified `system:verify` to `husky` only (docs/Jekyll bundle setup removed).
- **Marketplace SEO metadata**: Optimized `package.json` `keywords` for higher search intent — dropped low-value generics (`copy`, `extract`, `menu`, `function`, `time-saver`) and added feature/intent terms (`enum-generator`, `cron`, `dotenv`, `env-file`, `duplicate-file`, `code-snippets`), front-loading the highest-value terms while staying within the marketplace 30-keyword cap.
- **README restructure for discoverability**: Added a keyword-rich hero intro, surfaced the Marketplace/Open VSX install call-to-action near the top, merged redundant feature/keyboard-shortcut sections, and added descriptive alt text to all screenshots and demo GIFs.
- **Self-contained README**: Removed links to the GitHub Pages documentation site (being retired) and folded the essential per-feature reference inline so the README stands alone as the marketplace landing page.
- **Consistent project-gating wording in README**: Aligned Quick Start, Usage Guide, Requirements, and FAQ to state that context menus appear in any workspace and that `autoDetectProjects` framework detection is informational only — not a hard gate requiring a Node.js project or `package.json`.
- **Dev toolchain**: Bumped `lint-staged` from `^16.4.0` to `^17.0.5` (dev-only; pre-commit hook). Requires Node `>=22.22.1`, satisfied by the supported dev/CI Node range.
- **Security audit remediation**: Added pnpm overrides for vulnerable dev-only transitive dependencies (`uuid` via `@azure/msal-node`, `qs` via `typed-rest-client`) and refreshed Vitest, Mocha, tsx, and TypeScript ESLint tooling so `pnpm audit` reports zero vulnerabilities.
- **Open VSX packaging script**: Fixed `pnpm run package:openvsx` to build a VSIX with `vsce package`, matching the artifact consumed by `ovsx publish`.

### Fixed

- **Copy Function menu visibility**: `Copy Function` now appears in the editor context submenu only when the cursor is inside a detected function-like node.

<details>
<summary><h2>[2.1.0]</h2></summary>

### Added

- **📋 Copy File Contents**: New `additionalContextMenus.copyFileContents` command — right-click any single file in the Explorer to copy its entire contents to the clipboard without opening it. Appears in `explorer/context` under the "Copy Path" group; restricted to single non-folder files via `!explorerResourceIsFolder && !listMultiSelection` when-clause.
- **📁 Duplicate File**: New `additionalContextMenus.duplicateFile` command — right-click any single file in the Explorer to create a duplicate alongside the original. The duplicate is named `<basename>-duplicate<ext>`; if that name already exists, it auto-increments (`<basename>-duplicate-1<ext>`, `-2`, …). Appears in the Explorer `7_modification` group; restricted to single non-folder files via `!explorerResourceIsFolder && !listMultiSelection`.
- **🧪 Test suite**: Two-layer test infrastructure — Vitest unit tests for infrastructure utilities/services (`Cache`, `pathValidator`, `ConfigValidator`, `accessibilityHelper`, `CodeAnalysisService`, `ProjectDetectionService`, `FileDiscoveryService`) and Mocha + `@vscode/test-electron` integration tests for all 13 user-facing features end-to-end.
- **CI test jobs**: `test-unit` and `test-integration` jobs run in parallel after `lint` and must pass before `build` in the CI pipeline.
- **Coverage reporting**: Added `pnpm run test:unit:coverage` with LCOV output.
- **Community standards**: Added structured YAML bug and feature issue forms, pull request template, funding metadata, release-note categories, canonical labels, stale automation, label sync, all-contributors metadata/workflow, and third-party notices.
- **Cloud development**: Added a Dev Container/Codespaces setup with Node.js 24 (latest LTS), pnpm, recommended VS Code extensions, and Linux packages for headless VS Code integration tests.
- **Copilot guidance**: Added `.github/copilot-instructions.md` with architecture, command, test, and generated-file guidance.

### Changed

- **Node runtime floor raised to 22**: `engines.node` bumped from `>=20` to `>=22`. Supported runtimes: Node 22, 24 (LTS), and 26. esbuild `target` raised to `node22`. `@types/node` bumped to `^22`.
- **Developer toolchain pinned to Node 24 LTS**: `.nvmrc` → `lts/jod`; devcontainer base image → `typescript-node:24`. CI build matrix exercises Node 22/24/26 to validate the supported range.
- **VS Code engine floor bumped to `>=1.111.0`**: `engines.vscode` and `@types/vscode` aligned to the last 10 minor versions of VS Code (1.111–1.120). VS Code 1.110 and below are no longer supported.
- **CI/release split**: Moved tag-driven publishing from `.github/workflows/ci.yml` into `.github/workflows/release.yml`; CI now focuses on PR/main quality gates.
- **Site restructure**: Renamed Jekyll source from `site/` to `docs/`; moved packaged images from `docs/images/` to `public/images/` for cleaner extension packaging. Updated `release.yml` and `deploy-pages.yml` build paths accordingly.
- **Contributor docs**: Updated `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `AGENTS.md`, and `SECURITY.md` for coverage, workflow ownership, Codespaces, third-party notices, and supported versions.
- **Repo name corrected**: All URLs and references updated from `additional-contexts-menu` to `additional-context-menus`.
- **Bundle size references**: Replaced specific KB figures with "optimized" across all user-facing documentation and source comments.
- **Cache TTL injectable**: `ProjectDetectionService.create()` and `FileDiscoveryService.create()` now accept an optional `cacheTTL` parameter (defaults: 10 min and 5 min respectively), enabling precise cache expiry testing without mocking.
- **Test description convention**: All test descriptions now start with `"should "`.
- **Dev dependency upgrades** (patch/minor + selected majors; TypeScript and Node `@types` held back):
  - prettier 3.8.1 → 3.8.3
  - @typescript-eslint/{eslint-plugin,parser,typescript-eslint} 8.58.0 → 8.59.3
  - @vscode/vsce 3.7.1 → 3.9.1
  - eslint-plugin-promise 7.2.1 → 7.3.0
  - mocha 11.1.0 → 11.7.5
  - tsx 4.21.0 → 4.22.1
  - ovsx 0.10.10 → 0.10.12
  - eslint 9.39.4 → 10.4.0 · @eslint/js 9.39.4 → 10.0.1 · eslint-config-prettier 9.1.2 → 10.1.8 · eslint-plugin-n 17.24.0 → 18.0.1 · eslint-plugin-security 3.0.1 → 4.0.0
  - @commitlint/{cli,config-conventional} 19.8.1 → 21.0.1
  - vitest 3.1.1 → 4.1.6 · @vitest/coverage-v8 3.1.1 → 4.1.6
- **Build tooling**: Made commit/PR size-check exclusions configurable via `scripts/commit-size-excludes.txt`, shared between the husky hook and CI workflow.
- **Error propagation**: Re-thrown errors in `ContextMenuManager` and `terminalService` now carry `{ cause: originalError }` to satisfy the ESLint 10 `preserve-caught-error` rule and improve stack trace fidelity.
- **Bundle size reduced from 7.52MB to 3.82MB**: VSIX now well below the 5MB target.
  - `codeAnalysisService` moved to `dist/lazy/` (same pattern as generator services). The TypeScript compiler (~3.4MB minified) is no longer bundled in the core `extension.js`; it loads on the first Copy/Move Function command invocation. Core bundle drops from 3.46MB to 64KB, restoring the documented ≤100KB target.
  - GIF screenshots re-encoded with ffmpeg (fps 8, 70% scale, 64-colour palette): 6.0MB → 2.9MB (~51% reduction).
  - Dev-only files excluded from VSIX: `.devcontainer/`, `AGENTS.md`, `.cursorignore`, `.code-review-graph`.
  - Removed broken `marketplace` block from `package.json` (referenced 5 non-existent PNG screenshots and a missing `banner.png`).
  - Codespaces SVG badge removed from `README.md` (VS Code Marketplace restricts SVG image URLs).

### Removed

- **`copyCode.handleImports` setting**: Removed the unimplemented `handleImports` configuration option (`merge` / `duplicate` / `skip`) and all its references across source, types, config validator, configuration service, `ContextMenuManager`, `package.json`, and documentation. The import merging logic was never implemented (stub with TODO).
- **Walkthrough**: Removed `WalkthroughManager.ts` and `scripts/generate-changelog.js`.

### Fixed

- **`CodeAnalysisService.extractImports`**: Fixed crash when `importClause.namedBindings` is `undefined` for default imports (e.g. `import React from 'react'`). `ts.isNamespaceImport()` was called without a null guard, causing a `TypeError`.

</details>

<details>
<summary><h2>[2.0.1]</h2></summary>

### Changed

- **GitHub Pages site (`site/`)**: Improved responsive UI/UX—fluid typography, safer grids on small screens, touch-friendly controls, sticky-header scroll padding, safe-area insets, optional `prefers-color-scheme: dark` theming, hero/media frame styling, and clearer keyboard focus. Layout fixes: invalid markup on the Features page header, accessible mobile nav (`button` + `aria-expanded`), and `rel="noopener noreferrer"` on external links. Homepage **Features Documentation** section (`.services-docs` / `.service-card`) now has full card styling aligned with the rest of the site. **Features** page (`site/features.md`): fixed mismatched closing tags on the last "Cross-Platform Terminal" feature item that broke the DOM (stray `</div>` after the CTA). **Code operations** page (`site/code-operations.md`): added full styling for previously unstyled blocks (`.operation-section`, example cards, workflow steps, import/move/save panels, best-practices grid) so the long documentation page has clear hierarchy and filled bands instead of a bare container. Escaped `React.FC&lt;UserProfileProps&gt;` in the TSX sample so Jekyll/Kramdown does not treat the generics as real HTML tags (which broke the example grid and looked like empty layout); example cards are no longer scroll-animated so code blocks stay visible on load. **Documentation** Commands API section: copy tightened, per-row "Access:" boilerplate removed in favor of category hints; card grid and `<kbd>` styling (scoped under `.commands-api` so other pages' `.command-list` wrappers are unchanged).

</details>

<details>
<summary><h2>[2.0.0]</h2></summary>

### Added

- **🗂️ Unified Context Menu Submenu**: All commands are now grouped under a single **Additional Context Menus ▶** submenu in the right-click menu, replacing the previous scattered entries across multiple groups. The submenu appears in any file when the extension is enabled, with commands organised into four logical groups: Function Operations, Selection Operations, Workspace, and Generation.
- **🖥️ Open in Terminal in right-click menu**: `Open in Terminal` command now appears in the editor context menu (group `2_workspace@2`) in addition to its existing keyboard shortcut
- **⚙️ 6 utility commands in Command Palette**: `Show Output Channel`, `Debug Context Variables`, `Refresh Context Variables`, `Check Keybinding Conflicts`, `Enable Keybindings`, and `Disable Keybindings` are now declared in `package.json` and visible in the Command Palette
- **📦 No package.json Detection**: Informational message shown when no `package.json` is found in the workspace, explaining that Node.js project detection is required
- **🛡️ ConfigValidator**: New utility validates all string-enum configuration values on activation and logs warnings with the invalid key, received value, and fallback for any unrecognized setting
- **🔌 ICommandHandler Interface**: New `src/commands/ICommandHandler.ts` exports a formal `ICommandHandler` interface that all command handler classes now explicitly implement
- **📂 Barrel Index Files**: Added `index.ts` barrel files to `src/commands/`, `src/managers/`, `src/utils/`, and `src/types/` for clean module imports
- **⚙️ tsconfig.eslint.json**: Dedicated TypeScript config for ESLint type-aware rules, decoupling lint configuration from the production build
- **🤖 CI Workflow** (`.github/workflows/ci.yml`): Runs `pnpm run lint` and `pnpm run build` on every PR targeting `main`
- **🚀 Release Workflow** (`.github/workflows/release.yml`): Automated publishing to VS Code Marketplace and Open VSX Registry on `v*` tag pushes, with VSIX verification and GitHub Pages deployment
- **🔒 Security Workflow** (`.github/workflows/security.yml`): Runs `pnpm audit`, GitHub CodeQL analysis, and dependency review on every push and weekly schedule
- **🏷️ Open VSX Badge**: README now includes an Open VSX Registry badge linking to the extension listing
- **📝 markdownDescription**: All settings in `package.json` now include `markdownDescription` fields with usage examples for the VS Code Settings UI
- **🎨 galleryBanner**: Added `galleryBanner` field to `package.json` for VS Code Marketplace branding
- **📦 ovsx Config**: Added `ovsx` configuration section to `package.json` mirroring the `vsce` section

### Changed

- **⏱️ Generate Cron Expression**: Now inserts the bare cron expression at cursor position (e.g. `0 9 * * *`) — no comment line, no quotes
- **📁 Repository structure**: Jekyll GitHub Pages site moved from `docs/` to `site/`
- **📚 Features documentation realigned**: `site/services/` now documents the 11 user-facing features (Copy Function, Copy/Move Function to File, Copy/Move Selection to File, Save All, Open in Terminal, Rename File Convention, Generate Enum, Generate Cron, Generate .env File) instead of internal infrastructure services. Infrastructure services (CodeAnalysis, FileDiscovery, Configuration, ProjectDetection, Accessibility) no longer have standalone site docs.
- **🚀 CI release pipeline**: All publish/release jobs now trigger on `v*` tag pushes (previously incorrectly conditioned on `refs/heads/main`)
- **🌿 Release builds from `main`**: `release-build` job now checks out the `main` branch (`ref: main`) to ensure releases always use the latest stable code
- **📦 Pre-release support**: Tags containing `-rc`, `-next`, `-beta`, or `-alpha` automatically publish with `--pre-release` flag to both VS Code Marketplace and Open VSX Registry
- **📄 GitHub Pages deployment**: Now depends on both `publish-vscode` and `publish-openvsx` succeeding, and is skipped entirely for pre-release tags
- **🏷️ GitHub Releases**: Pre-release tags create GitHub Releases marked as pre-release; stable tags create standard releases
- **💬 Improved Error Messages**: Function-not-found warning now lists supported function types and suggests checking cursor placement; file operation errors now include the target file path; disable confirmation now includes the re-enable command name
- **🔧 ESLint Config**: Updated `eslint.config.mjs` to use `tsconfig.eslint.json` instead of `tsconfig.json` for the `src/` configuration block
- **📚 CONTRIBUTING.md**: Restructured with a dedicated Branching Strategy section covering feature branches, Conventional Commits format, PR process, and CI workflow documentation; setup process consolidated to 5 steps with `tsconfig.eslint.json` reference
- **📖 DEVELOPER.md**: Commands table updated to note `tsconfig.eslint.json` usage in lint; project structure updated to include `tsconfig.eslint.json`; new ESLint Type-Aware Rules section added
- **📋 docs/developer-guides/adding-commands.md**: Updated to reference `ICommandHandler` interface and demonstrate barrel `index.ts` imports

### Fixed

- **🔧 CI: Missing pnpm setup in publish jobs**: Added `Install PNPM` and `Setup Node.js` steps to `publish-vscode` and `publish-openvsx` jobs — previously `pnpm dlx` would fail as pnpm was not available on the runner
- **🔧 CI: Removed unnecessary pnpm install from `setup` job**: The `setup` job only extracts version/tag from `GITHUB_REF` via a shell script; it never calls pnpm, so the `Install PNPM`, `Setup Node.js`, and `Install Dependencies` steps were redundant
- **🔧 CI: Removed `schedule` trigger**: Weekly scheduled runs were not required and have been removed from the workflow
- **🔐 Dependency Vulnerabilities**: Upgraded `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@stylistic/eslint-plugin`, `@vscode/vsce`, `ovsx`, `lint-staged`, `mocha`, and `@vscode/test-cli` to resolve 33 high/moderate vulnerabilities in dev tooling (none affected the shipped VSIX)
- **🔄 CodeAnalysisService**: Migrated from regex-based to AST-based function detection using TypeScript Compiler API
  - Improved accuracy for nested functions (returns inner-most function)
  - Eliminated false positives in comments and strings
  - Enhanced React component and hook detection
  - Bundle size increased (TypeScript Compiler API dependency)
  - No breaking changes to public API
  - Updated 7 documentation files to reflect AST-based approach

### Added

- **📝 Copy Function to File**: New command to copy function at cursor position to target file
- **📝 Move Function to File**: New command to move function at cursor position to target file (removes from source)
- **🖥️ Open in Terminal**: Cross-platform terminal integration with comprehensive platform support
  - Right-click context menu integration for quick terminal access
  - **Three terminal types**: Integrated, External, System Default with intelligent detection
  - **Cross-platform support**: Windows (cmd/PowerShell), macOS (Terminal.app), Linux (auto-detection)
  - **Configurable directory behaviors**: Parent directory, workspace root, current directory
  - **Robust error handling**: Permission validation, path checking, graceful fallbacks
  - **Custom external terminal support**: User-configurable commands with directory placeholders
- **📏 Rename File Convention**: Automatic file renaming to common naming conventions
  - Support for kebab-case, camelCase, and PascalCase
  - Quick action to suggest and apply file name transformations
- **💰 FUNDING.yml**: Added GitHub Sponsors configuration for community support
- **📋 NOTICE.md**: Added third-party software attribution document for transparency
- **⌨️ Keyboard Shortcuts**: Complete keybinding system with 7 shortcuts for core commands
  - `Ctrl+Alt+Shift+F` - Copy Function
  - `Ctrl+Alt+Shift+E` - Copy Function to File
  - `Ctrl+Alt+Shift+C` - Copy Selection to File
  - `Ctrl+Alt+Shift+R` - Move Function to File
  - `Ctrl+Alt+Shift+M` - Move Selection to File
  - `Ctrl+Alt+Shift+A` - Save All
  - `Ctrl+Alt+Shift+T` - Open in Terminal
- **🎯 Function Detection Context**: New `additionalContextMenus.isInFunction` context variable for smarter menu visibility
- **🔧 TerminalService**: New service for cross-platform terminal operations
  - Intelligent terminal type detection based on platform and configuration
  - Support for integrated, external, and system-default terminals
  - Configurable open behavior for different directory contexts
- **📊 EnumGeneratorService**: Generate TypeScript enums from union types
  - Automatic enum generation from selected union type definitions
  - Support for string literal types in unions
  - Quick action via command palette and context menu
- **🔐 EnvFileGeneratorService**: Create .env files from .env.example
  - Automatic .env file creation with values from example files
  - Environment variable template generation
  - Support for multiple .env.example formats
- **⏰ CronJobTimerGeneratorService**: Generate cron expressions
  - Visual cron expression builder with preset schedules
  - Support for common schedules (hourly, daily, weekly, monthly)
  - Custom cron expression generation with validation
- **📝 FileNamingConventionService**: Rename files to common conventions
  - Automatic detection of file naming pattern
  - One-click transformation to kebab-case, camelCase, or PascalCase
  - Integration with file system watchers for consistency
- **⚙️ Enhanced Configuration System**: New terminal-specific settings
  - `additionalContextMenus.terminal.type` - Choose terminal type (integrated/external/system-default)
  - `additionalContextMenus.terminal.externalTerminalCommand` - Custom external terminal command
  - `additionalContextMenus.terminal.openBehavior` - Directory selection behavior
- **🧪 Expanded Testing Infrastructure**: Comprehensive E2E test suite with 53 test cases
  - Terminal service testing with cross-platform scenarios
  - Enhanced test utilities for better testing architecture
  - Error condition and configuration edge case testing
  - Service-specific test suites for all new services
  - Command-specific test suites for all user-facing commands

### Changed (Breaking Changes)

- **🔄 Command Renaming**:
  - `copyCodeToFile` → `copySelectionToFile` (BREAKING - command ID changed)
  - `moveCodeToFile` → `moveSelectionToFile` (BREAKING - command ID changed)
- **📦 Version bump to 2.0.0**: Major version due to breaking command changes and feature removal

### Removed

- **❌ StatusBarService**: Removed status bar integration (was in v1.1.0)
  - Removed visual project status indicators
  - Removed real-time project detection status display
  - Removed clickable status bar with debug functionality

### Enhanced

- **🖱️ Context Menu System**: Improved command visibility and organization
  - Terminal option appears for all file types (not just Node.js projects)
  - Seamless integration with existing Copy, Move, and Save All operations
  - Consistent behavior across different project types and frameworks
  - Function detection context for smarter menu items
- **🏗️ Service Architecture**: Expanded service ecosystem
  - Added 4 new services (TerminalService, EnumGeneratorService, EnvFileGeneratorService, CronJobTimerGeneratorService)
  - New FileNamingConventionService for file operations
  - Consistent error handling and logging patterns across all services
  - Singleton pattern implementation for all services
- **🔧 Node.js Compatibility**: Verified Node.js 16-24 compatibility
  - Updated all documentation to explicitly state Node.js version support
  - Enhanced GitHub workflows to use Node.js 20.x for tooling consistency
  - Fixed @types/node dependency version alignment
  - Updated system requirements in installation documentation
- **📚 Documentation Improvements**: Comprehensive documentation updates
  - GitHub wiki with detailed service documentation
  - API reference for all services and commands
  - Updated README.md with new features and configuration examples
  - Enhanced troubleshooting documentation for cross-platform issues
- **🛠️ Development Infrastructure**: Improved development environment
  - Updated GitHub workflows for consistent Node.js version usage (20.x for tooling)
  - Maintained comprehensive Node.js testing matrix (16.x, 18.x, 20.x, 22.x, 24.x) in CI
  - Enhanced security audit workflows with latest tooling versions
  - Verified TypeScript and esbuild configurations for broad Node.js compatibility
- **🔧 Build Process Modernization**: Upgraded entire build workflow
  - **Primary build command**: `pnpm run build` now uses tsx with TypeScript config execution
  - **Updated CI workflows**: All automation now uses 'build' script instead of 'compile'
  - **Development workflow**: Enhanced watch mode and production build processes
  - **TypeScript-first scripting**: All build scripts use direct TypeScript execution via tsx
- **📊 Performance Improvements**: Build system optimization
  - Enhanced build performance reporting with detailed metrics and target verification
  - Bundle size monitoring with lazy-loaded services (optimized core + lazy)
  - Improved development experience with faster builds and better error reporting

### Technical Improvements

- **🔧 Code Quality**: Enhanced development infrastructure
  - Updated GitHub templates for better contribution experience
  - Improved testing coverage for new terminal functionality
  - Enhanced documentation and API reference materials
- **📖 Documentation**: Comprehensive updates
  - GitHub wiki with detailed terminal integration guide
  - Updated README.md with terminal features and configuration examples
  - Enhanced troubleshooting documentation for cross-platform issues
- **🌐 Cross-Platform Reliability**: Robust platform detection and handling
  - Automatic terminal application detection on Linux systems
  - Intelligent fallback mechanisms for unsupported configurations
  - Platform-specific command generation and error handling
- **📋 Build Command Migration**: Systematic update from 'compile' to 'build' across all documentation and workflows
- **🏗️ Configuration Architecture**: Modular esbuild configuration with environment-specific optimizations
- **🔄 CI/CD Pipeline Updates**: GitHub Actions workflows updated for improved build consistency

</details>

<details>
<summary><h2>[1.1.0]</h2></summary>

### Added

- **⌨️ Keyboard Shortcuts System**: Complete keybinding support with conflict detection
  - New `enableKeybindings` setting (default: false) to enable/disable keyboard shortcuts
  - New `showKeybindingsInMenu` setting (default: true) to control shortcut visibility in context menus
  - Default keybindings for all core commands:
    - `Ctrl+Alt+Shift+F` (`Cmd+Alt+Shift+F` on Mac) - Copy Function
    - `Ctrl+Alt+Shift+C` (`Cmd+Alt+Shift+C` on Mac) - Copy Code to File
    - `Ctrl+Alt+Shift+M` (`Cmd+Alt+Shift+M` on Mac) - Move Code to File
    - `Ctrl+Alt+Shift+A` (`Cmd+Alt+Shift+A` on Mac) - Save All Files
  - Keybinding conflict detection and management commands
  - Built-in safety with disabled-by-default setting to prevent conflicts

- **📊 Status Bar Integration**: Visual project status indicators
  - Framework-specific icons for React (⚛️), Angular (🅰️), Express (🚂), and Next.js (▲)
  - Real-time project detection status display
  - Extension state indicators (enabled/disabled, Node.js project detection)
  - Clickable status bar with debug functionality
  - Color-coded status (prominent for active projects, warning for disabled)

- **🔧 Enhanced Command System**: New debug and management commands
  - `Additional Context Menus: Debug Context Variables` - Inspect extension state
  - `Additional Context Menus: Refresh Context Variables` - Reload project detection
  - `Additional Context Menus: Check Keybinding Conflicts` - Detect potential conflicts
  - `Additional Context Menus: Enable Keybindings` - Enable keyboard shortcuts
  - `Additional Context Menus: Disable Keybindings` - Disable keyboard shortcuts

### Enhanced

- **⚙️ Configuration Management**: Expanded settings for better user control
  - Enhanced keybinding management with safety warnings
  - Improved project detection feedback through status bar
  - Better visual feedback for extension state changes

### Technical Improvements

- **🏗️ Architecture**: Added StatusBarService for centralized status management
- **🔄 Real-time Updates**: Status bar updates automatically on configuration and workspace changes
- **🛡️ Safety Features**: Keybindings disabled by default to prevent conflicts with existing shortcuts

</details>

<details>
<summary><h2>[1.0.0]</h2></summary>

### Fixed

- **Critical Test Infrastructure**: Fixed path resolution bug in test runner that prevented extension discovery during automated testing
- **Extension Activation**: Resolved extension activation failures in test environments due to incorrect extensionDevelopmentPath calculation

### Added

- **🧪 Comprehensive Test Suite**: Expanded from 19 to 53 tests (178.9% increase) with enterprise-grade edge case coverage
- **🔧 Error Boundary Testing**: Added robust tests for extreme conditions including:
  - Large files with 1000+ functions
  - Special characters in file paths
  - Rapid successive command executions
  - UTF-8 edge cases and unusual content
- **⚡ Performance & Stress Testing**: Added comprehensive tests for:
  - Deeply nested function structures (20+ levels)
  - Concurrent Save All operations
  - Memory pressure scenarios with large data sets
- **⚙️ Configuration Edge Case Testing**: Added tests for:
  - Rapid configuration changes
  - Invalid configuration values
  - Extreme configuration values (100+ extensions)
- **📁 Multi-workspace & File System Testing**: Added tests for:
  - Nested project structures
  - Very long file paths (10+ directory levels)
  - Files without extensions
  - Symbolic links and shortcuts
- **🧠 AST Parsing & Concurrent Operations Testing**: Added tests for:
  - Complex TypeScript syntax (generics, decorators, private fields)
  - JSX with complex props and nested components
  - Concurrent copy operations without conflicts
  - Malformed but parseable JavaScript edge cases

### Quality Assurance

- **✅ 100% Test Success Rate**: All 53 tests pass consistently (53/53 passing)
- **🔧 Code Quality**: Fixed all ESLint errors including regex escaping and missing braces
- **💅 Code Formatting**: Applied Prettier formatting across all test files
- **🏗️ Production Ready**: Enhanced error handling and graceful degradation for edge cases

### Developer Experience

- **📊 Comprehensive Coverage**: Tests now cover real-world production scenarios
- **🛡️ Robust Error Handling**: Extension handles extreme conditions gracefully without crashes
- **🔍 Better Debugging**: Enhanced logging and error reporting for complex scenarios
- **⚡ Reliable Performance**: Proven stability under stress testing conditions

### Initial Release

- Enhanced right-click context menus for Node.js development
- Support for React, Angular, Express, Next.js projects
- TypeScript and JavaScript intelligent code operations
- Copy Function feature with AST-based function detection
- Copy to Existing File with smart import handling
- Move to Existing File with conflict resolution
- Save All functionality with progress feedback
- Automatic Node.js project detection
- Configurable extension settings
- Smart code insertion with context awareness
- Import statement merging and deduplication
- Read-only file handling in Save All
- Extension enable/disable commands
- Output channel for debugging and logging

### Performance Improvements

- **Build System Migration**: Migrated from webpack to esbuild for dramatically improved performance
- **Build Speed**: 20x faster builds (~19 seconds → ~1 second)
- **Bundle Size**: Optimized production bundle with significant size reduction
- **Development Experience**: Near-instant rebuilds in watch mode
- **Bundle Analysis**: Added comprehensive bundle composition analysis script
- **Dependency Optimization**: Removed 99 unnecessary webpack-related packages

### Features

- **Smart Context Menus**: Conditionally shown based on project type and file compatibility
- **Function Extraction**: AST-based function detection and copying with proper syntax highlighting
- **Code Operations**: Intelligent copy/move operations with import conflict resolution
- **Project Detection**: Automatic detection of React, Angular, Express, and Next.js projects
- **Configuration**: Extensive settings for customizing behavior
- **Progress Feedback**: Visual feedback for long-running operations

### Configuration Options

- Enable/disable extension
- Auto-detect Node.js projects
- Supported file extensions (.ts, .tsx, .js, .jsx)
- Code insertion point (smart, end, beginning)
- Import handling (merge, duplicate, skip)
- Comment preservation
- Save All notifications
- Read-only file handling

### Commands

- `additionalContextMenus.copyFunction` - Copy Function
- `additionalContextMenus.copyCodeToFile` - Copy to Existing File
- `additionalContextMenus.moveCodeToFile` - Move to Existing File
- `additionalContextMenus.saveAll` - Save All
- `additionalContextMenus.enable` - Enable extension
- `additionalContextMenus.disable` - Disable extension
- `additionalContextMenus.showOutputChannel` - Show Output Channel

### Technical Changes

- Replaced webpack build system with esbuild for superior performance
- Added esbuild configuration with VS Code extension optimizations
- Implemented bundle analysis with metafile generation
- Removed unused dependencies (webpack, terser-webpack-plugin, ts-loader, recast)
- Updated all build scripts to use esbuild
- Added bundle optimization monitoring and performance reporting
- Maintained full VS Code extension compatibility
- Preserved all existing functionality with comprehensive test coverage

</details>

<details>
<summary><h2>[0.0.0]</h2></summary>

### Added

- Initial project setup
- Core extension architecture
- Service-oriented design pattern
- TypeScript configuration
- Testing framework setup
- Build and packaging configuration
- ESLint and Prettier setup
- esbuild bundling (migrated from webpack)
- VS Code extension manifest

</details>
