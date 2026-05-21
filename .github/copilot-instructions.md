# Copilot Instructions

Additional Context Menus is a TypeScript VS Code extension using pnpm, esbuild, Vitest unit tests, and Mocha plus `@vscode/test-electron` integration tests.

## Architecture

- Extension activation starts in `src/extension.ts`.
- Command handlers live in `src/commands/`; larger standalone commands use the class-based `ICommandHandler` pattern.
- `src/managers/ContextMenuManager.ts` owns most context-menu command wiring and simpler inline handlers.
- Services live in `src/services/`; shared contracts live in `src/di/interfaces/` and `src/types/`.
- Keep user-facing docs in `README.md` and `CHANGELOG.md` aligned with behavior changes.

## Development Rules

- Use TypeScript and existing service/DI patterns.
- Do not commit generated output in `dist/`, `out-test/`, `.vsix` files, or compiled `.js`/`.js.map` files under `src/`, `test/`, or `scripts/`.
- Prefer focused changes and Conventional Commits.
- Update `package.json`, related types, tests, and docs together when configuration or command behavior changes.

## Commands

- Install: `pnpm install`
- Build: `pnpm run build`
- Lint: `pnpm run lint`
- Unit tests: `pnpm run test:unit`
- Coverage: `pnpm run test:unit:coverage`
- Integration tests: `pnpm run test:integration`
- Package VSIX: `pnpm run package`

Run integration tests before user-facing context menu, command, file operation, or editor interaction changes.

## Assistant Conventions

### Communication

Default to **caveman mode** (terse: drop articles/filler/pleasantries; fragments OK). Keep technical substance exact. Code/commits/PRs/security warnings stay in normal English. Disable on request ("normal mode").

### Shell commands

Prepend `rtk` to all shell invocations when available — 60-90% token savings on dev ops. Examples: `rtk git status`, `rtk pnpm test`, `rtk ls`. Fallback to direct command if `rtk` unavailable, or for compound predicates (`find -not`, `find -exec`) which rtk does not support.
