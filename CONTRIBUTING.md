# Contributing to Additional Context Menus

Thank you for your interest in contributing to Additional Context Menus! We welcome contributions from the community and appreciate your help in making this VS Code extension better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 22+ required, 22, 24, and 26 supported; Node 24 LTS recommended for development)
- [PNPM](https://pnpm.io/) (install with `npm install -g pnpm`)
- [Visual Studio Code](https://code.visualstudio.com/) (for development and testing)
- [Git](https://git-scm.com/)
- Run `pnpm run system:verify` after install to set up Husky

### Types of Contributions

We welcome several types of contributions:

- 🐛 **Bug Reports** - Help us identify and fix issues
- 🚀 **Feature Requests** - Suggest new functionality
- 📝 **Documentation** - Improve or add documentation
- 🔧 **Code Contributions** - Fix bugs or implement features
- 🎨 **Design** - Improve UI/UX or visual assets

## Development Setup

### 1. Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/additional-context-menus.git
   cd additional-context-menus
   ```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build and Verify

```bash
# Build the extension (requires Node.js 22+; Node 24 LTS recommended)
pnpm run build

# Run ESLint — uses tsconfig.eslint.json for type-aware rules
pnpm run lint
```

> **Note on `tsconfig.eslint.json`**: The project uses a dedicated `tsconfig.eslint.json` (extending `tsconfig.json`) for ESLint's type-aware rules. It includes `src/`, `scripts/`, and `esbuild.config.ts` with `noEmit: true` so linting never affects the production build output.

### 4. Launch Development Environment

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. Test your changes in the new VS Code window

### 5. Other Useful Commands

```bash
pnpm run watch      # Watch mode for active development
pnpm run package    # Production build + VSIX packaging
pnpm run format     # Format code with Prettier
pnpm run test:unit       # Run unit tests (Vitest)
pnpm run test:unit:coverage  # Run unit tests with LCOV coverage
pnpm run test:integration  # Run integration tests (requires display/xvfb on Linux)
```

The repository also includes a Dev Container and GitHub Codespaces configuration. Opening the project in that environment installs Node.js 24 (latest LTS), pnpm dependencies, recommended VS Code extensions, and Linux packages required for headless integration tests.

## Testing

The project has two test layers:

| Layer       | Command                       | Framework                       | What's covered                                                     |
| ----------- | ----------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| Unit        | `pnpm run test:unit`          | Vitest                          | Infrastructure utilities and services with mocked VS Code API      |
| Coverage    | `pnpm run test:unit:coverage` | Vitest + V8 coverage            | Unit tests plus `coverage/lcov.info`                               |
| Integration | `pnpm run test:integration`   | Mocha + `@vscode/test-electron` | All 13 user-facing features, end-to-end in a real VS Code instance |

**Unit tests** cover: `Cache`, `pathValidator`, `ConfigValidator`, `accessibilityHelper`, `CodeAnalysisService`, `ProjectDetectionService`, `FileDiscoveryService`.

**Integration tests** cover: Copy Function, Copy/Move Function to File, Copy/Move Selection to File, Save All, Open in Terminal, Rename File to Convention, Generate Enum, Generate Cron, Generate .env, Copy File Contents, Duplicate File.

On Linux, integration tests require a display. Use `xvfb-run -a pnpm run test:integration` in headless environments.

## Making Changes

### Branching Strategy

All contributions use feature branches off `main`. Branch names follow this convention:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring

Examples:

- `feature/add-context-menu-icons`
- `fix/function-detection-accuracy`
- `docs/improve-setup-guide`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

body (optional)

footer (optional)
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

Examples:

- `feat(context-menu): add copy function with AST parsing`
- `fix(code-analysis): handle edge case for arrow functions`
- `docs(readme): update installation instructions`

### Commit Standards

Commit messages and size are enforced automatically via git hooks (commitlint + husky) and CI.

#### Message Format (enforced by `commit-msg` hook)

```
type(scope): short description
```

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature or capability                               |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore`    | Maintenance, dependency updates, tooling                |
| `ci`       | CI/CD workflow changes                                  |
| `test`     | Adding or updating tests                                |
| `perf`     | Performance improvement                                 |
| `style`    | Formatting, whitespace (no logic change)                |
| `build`    | Build system changes                                    |
| `revert`   | Reverts a previous commit                               |

Breaking changes: append `!` after the type — `feat!: remove deprecated API`

#### Commit Size Limits (enforced by `pre-commit` hook + CI)

| Limit                        | Value   | Rationale                            |
| ---------------------------- | ------- | ------------------------------------ |
| Max files per commit         | **10**  | Keeps commits focused and reviewable |
| Max lines changed per commit | **400** | Prevents large, hard-to-review diffs |

If your change exceeds these limits, split it into multiple focused commits. For sweeping refactors that cannot reasonably be split, add the `size/override` label to the PR — the CI check will post a warning but will not hard-fail.

```bash
# Stage and commit one logical group at a time
git add src/services/terminalService.ts
git commit -m "feat(terminal): add integrated terminal support"

git add src/commands/openInTerminal.ts
git commit -m "feat(terminal): add openInTerminal command handler"
```

> **Note:** `--no-verify` bypasses local hooks but the CI `commit-size` job will still block oversized PRs.

#### Grandfathered History

Commits before `v2.0.0` predate this enforcement and are not subject to these rules. Enforcement applies to all commits from the next release onwards.

### Pull Request Process

1. Create a branch from `main` using the naming convention above
2. Make your changes with conventional commits
3. Run `pnpm run lint && pnpm run build` to verify everything passes
4. Open a PR against `main` with a clear title and description
5. The CI workflow will automatically run lint and build checks
6. At least one maintainer review is required before merging
7. PRs are squash-merged to keep the history clean

### Automation Workflows

The repository separates quality gates, release publishing, and community automation.

**CI (`.github/workflows/ci.yml`, on PRs and pushes to `main`):**

- `lint` — runs `pnpm run lint`
- `test-unit` — runs `pnpm run test:unit:coverage`
- `test-integration` — runs `pnpm run test:integration` (Mocha + VS Code, Ubuntu, after `lint`, parallel with `test-unit`)
- `build` — builds on Ubuntu, Windows, macOS × Node 20/22/24 × VS Code stable/insiders (after both test jobs pass)
- `audit` — runs `pnpm audit --audit-level=high`
- `dependency-review` — reviews dependency changes on PRs

**Release (`.github/workflows/release.yml`, on `v*` tag push):**

- `setup` — extracts version, detects pre-release (`-rc`, `-next`, `-beta`, `-alpha`)
- `release-build` — checks out the tag and builds the production VSIX
- `verifier` — validates VSIX contents (no source files, no node_modules, correct bundle)
- `publish-vscode` — publishes to VS Code Marketplace (stable or `--pre-release`)
- `publish-openvsx` — publishes to Open VSX Registry (stable or `--pre-release`)
- `create-release` — creates a GitHub Release with the VSIX attached

**Community automation:**

- `stale.yml` marks inactive issues and PRs stale.
- `labels-sync.yml` syncs labels from `.github/labels.yml`.
- `all-contributors.yml` refreshes the README contributors table.

### Code Architecture

Additional Context Menus follows a service-oriented architecture:

```
src/
├── extension.ts              # Entry point
├── managers/
│   ├── extensionManager.ts   # Lifecycle management
│   └── contextMenuManager.ts # Context menu control
├── services/
│   ├── projectDetectionService.ts # Project detection
│   ├── configurationService.ts    # Settings integration
│   ├── fileDiscoveryService.ts    # File operations
│   ├── fileSaveService.ts         # Save operations
│   └── codeAnalysisService.ts     # AST analysis
├── utils/
│   └── logger.ts             # Logging utilities
└── types/
    └── extension.ts          # Type definitions
```

When making changes:

1. **Follow the existing architecture**
2. **Add new functionality to appropriate layers**
3. **Maintain separation of concerns**
4. **Use proper TypeScript typing**

## Submitting Changes

See the [Pull Request Process](#pull-request-process) section above for the full workflow. Before opening a PR, run:

```bash
pnpm run lint
pnpm run format
pnpm run build
pnpm run test:unit
```

## Style Guidelines

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Enable **strict mode** compliance
- Use **meaningful variable names**
- Add **JSDoc comments** for public functions
- Follow **ESLint rules** configured in the project

### Code Formatting

- Use **Prettier** for consistent formatting
- Run `pnpm run format` before committing
- Use **2 spaces** for indentation
- Use **semicolons** at line endings
- Use **single quotes** for strings

### File Organization

- Keep files **focused and small**
- Use **descriptive file names**
- Group related functionality
- Follow the existing **directory structure**

## Documentation

### README Updates

When making changes that affect users:

- Update feature descriptions
- Add new configuration options
- Update screenshots if UI changes
- Modify installation or usage instructions

### Code Documentation

- Add **JSDoc comments** for public APIs
- Include **parameter descriptions**
- Document **return types**
- Add **usage examples** for complex functions

### CHANGELOG

Update `CHANGELOG.md` for:

- **New features** - Added functionality
- **Bug fixes** - Resolved issues
- **Breaking changes** - Incompatible changes
- **Deprecated features** - Features being removed

## Community

### Getting Help

- **GitHub Issues** - Report bugs or request features
- **GitHub Discussions** - Ask questions and share ideas
- **Email** - Contact maintainer at <vijayanand431@gmail.com>

### Recognition

Contributors are recognized in:

- **README.md** - Contributors section
- **Release Notes** - Major contribution acknowledgments
- **GitHub** - Contributor graphs and statistics

## Development Tips

### VS Code Extensions

Helpful extensions for development:

- **TypeScript Importer** - Auto-import management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitLens** - Git integration

### Debugging

1. **Use VS Code debugger** - Set breakpoints in source code
2. **Console logging** - Use the logger utility for debugging
3. **Extension Host** - Check Developer Tools in Extension Development Host
4. **Output Channel** - Monitor "Additional Context Menus" output channel

### Performance Considerations

- **Minimize AST parsing operations**
- **Cache project detection results**
- **Implement proper disposal** of resources
- **Test with large codebases** to ensure performance

## Questions?

If you have questions about contributing:

1. Check existing [issues](https://github.com/Vijay431/additional-context-menus/issues)
2. Search [discussions](https://github.com/Vijay431/additional-context-menus/discussions)
3. Create a new issue with the "question" label
4. Email the maintainer: <vijayanand431@gmail.com>

Thank you for contributing to Additional Context Menus! 🚀
