<div align="center">
  <img src="./logo.png" alt="Additional Context Menus" width="128" />
</div>

# Additional Context Menus

[![CI](https://github.com/Vijay431/additional-context-menus/actions/workflows/ci.yml/badge.svg)](https://github.com/Vijay431/additional-context-menus/actions/workflows/ci.yml)
[![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus)
[![Open VSX Registry](https://img.shields.io/open-vsx/v/VijayGangatharan/additional-context-menus)](https://open-vsx.org/extension/VijayGangatharan/additional-context-menus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Installs](https://vsmarketplacebadges.dev/installs-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus)
[![Rating](https://vsmarketplacebadges.dev/rating-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus&ssr=false#review-details)

> Supercharge your development with intelligent right-click menus for file operations and code refactoring.

---

## About the Project

### The "Why"

Developers constantly lose time to repetitive, manual code refactoring — extracting a function from one file, switching to another, pasting it in, then hunting down every missing import. There's no built-in shortcut for that in VS Code. The same friction shows up with file operations: bulk-saving, opening a terminal at the right directory, renaming to a project convention — all small tasks that add up to a real drag on flow.

Additional Context Menus brings those workflows to your right-click menu. With a single click you can move a function, carry its imports along, rename a file to convention, generate boilerplate, or launch a terminal — without ever leaving the editor.

### Features

- **AST-Based Function Extraction**: Copy or move functions precisely using the Babel parser (`@babel/parser`) and `@babel/types` — no regex, no guessing.
- **Smart Import Management**: When copying or moving selected code, existing imports are automatically merged into the target file.
- **Save All & Terminal Integration**: Bulk-save all open files securely, or open an integrated/external terminal pointed at any file's directory.
- **Generators**: Generate TypeScript Enums, interactive Cron expressions, and `.env` template files from the context menu.
- **File System Workflows**: Rename files to common naming conventions, duplicate them, or copy their contents directly from the Explorer.

### Tech Stack

- TypeScript
- VS Code Extension API
- Node.js
- Babel parser (AST parsing)

### Visuals

<details>
<summary>Click to view feature demos (GIFs)</summary>

**Copy Function**

![Copy Function demo](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/demos/copy-function.gif)

**Copy Function to File**

![Copy Function to File demo](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/demos/copy-function-to-file.gif)

**Move Function to File**

![Move Function to File demo](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/demos/move-function-to-file.gif)

**Copy Selection to File**

![Copy Selection to File demo](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/demos/copy-selection-to-file.gif)

**Save All**

![Save All demo](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/demos/save-all.gif)

**Open in Terminal**

![Open in Terminal demo](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/demos/open-in-terminal.gif)

**Rename File to Convention**

![Rename File to Convention demo](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/demos/rename-file-convention.gif)

</details>

---

## Setup & Installation

### Prerequisites

- **VS Code**: Version `1.111.0` or later.
- A workspace with source code files (Node.js, React, Angular, Next.js, or any TS/JS project).

### Install Commands

**VS Code Marketplace** (recommended):

```bash
ext install VijayGangatharan.additional-context-menus
```

Or search **"Additional Context Menus"** in the Extensions view (`Ctrl+Shift+X`).

**Open VSX** (VS Codium / other open-source VS Code builds):
[open-vsx.org/extension/VijayGangatharan/additional-context-menus](https://open-vsx.org/extension/VijayGangatharan/additional-context-menus)

**Command line:**

```bash
code --install-extension VijayGangatharan.additional-context-menus
```

---

## Usage

### Quick Start

1. **Install** from VS Code Marketplace.
2. **Open** any `.ts`, `.tsx`, `.js`, or `.jsx` file in VS Code.
3. **Right-click** inside the editor or on a file in the Explorer.
4. **Select** an action from the **Additional Context Menus** submenu.

### Examples

**Extracting a Function**

1. Place your cursor inside any function in a `.ts` or `.js` file.
2. Right-click → **Additional Context Menus** ▶ **Move Function to File**.
3. Choose the target file. The function is relocated instantly.

**Moving Selected Code with Imports**

1. Highlight a block of code spanning multiple lines.
2. Right-click → **Additional Context Menus** ▶ **Move Selection to File**.
3. Pick the target file. Relevant imports from the source are automatically merged.

### Configuration

All settings live under the `additionalContextMenus.*` namespace in your VS Code `settings.json`:

**Core**

| Setting               | Type     | Default                          | Description                                      |
| --------------------- | -------- | -------------------------------- | ------------------------------------------------ |
| `enabled`             | boolean  | `true`                           | Enable or disable the extension                  |
| `autoDetectProjects`  | boolean  | `true`                           | Automatically detect frameworks in the workspace |
| `supportedExtensions` | string[] | `[".ts", ".tsx", ".js", ".jsx"]` | File extensions where context menus will appear  |

**Code Copy**

| Setting                     | Type    | Default   | Description                                                    |
| --------------------------- | ------- | --------- | -------------------------------------------------------------- |
| `copyCode.insertionPoint`   | string  | `"smart"` | Where to insert copied code: `"smart"`, `"end"`, `"beginning"` |
| `copyCode.preserveComments` | boolean | `true`    | Preserve comments when copying code                            |

**Save All**

| Setting                    | Type    | Default | Description                                |
| -------------------------- | ------- | ------- | ------------------------------------------ |
| `saveAll.showNotification` | boolean | `true`  | Show a notification after saving all files |
| `saveAll.skipReadOnly`     | boolean | `true`  | Skip read-only files when saving all       |

**Terminal**

| Setting                            | Type   | Default              | Description                                                                        |
| ---------------------------------- | ------ | -------------------- | ---------------------------------------------------------------------------------- |
| `terminal.type`                    | string | `"integrated"`       | Terminal to open: `"integrated"`, `"external"`, `"system-default"`                 |
| `terminal.externalTerminalCommand` | string | `""`                 | Custom command for external terminal. Use `{{directory}}` as a placeholder.        |
| `terminal.openBehavior`            | string | `"parent-directory"` | Directory to open: `"parent-directory"`, `"workspace-root"`, `"current-directory"` |

---

## Getting Help & Contributing

### Troubleshooting

<details>
<summary>Context menus aren't showing up</summary>

Make sure you are right-clicking inside an active editor tab with a supported file type (`.ts`, `.tsx`, `.js`, `.jsx`). Check that `additionalContextMenus.enabled` is `true` in your settings.

</details>

<details>
<summary>Function extraction isn't precise</summary>

The AST parser requires syntactically valid code. Ensure the file has no compile errors before extracting.

</details>

<details>
<summary>Imports not merged when using Copy / Move</summary>

Import merging only applies to **Copy Selection to File** and **Move Selection to File**. The **Copy / Move Function to File** commands transfer the function body only.

</details>

<details>
<summary>Using the extension in non-Node.js projects</summary>

Yes — context menus appear in any workspace. `autoDetectProjects` identifies frameworks for informational purposes only and does not gate the menus. Basic file operations work everywhere.

</details>

<details>
<summary>Framework support (Vue, Svelte, etc.)</summary>

The extension currently detects React, Angular, Express, and Next.js projects. Support for additional frameworks is on the roadmap.

</details>

### Contribution Guidelines

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines, including how to set up the local development environment. Please open an issue to discuss significant changes before submitting a Pull Request.

### Contact

**Vijay Gangatharan**

- 📧 Email: <vijayanand431@gmail.com>
- 🐙 [GitHub Repository](https://github.com/Vijay431/additional-context-menus)

---

## Additional Sections

### Roadmap

Future updates will focus on extending language support beyond the JavaScript/TypeScript ecosystem:

- [ ] Go
- [ ] Python
- [ ] .NET
- [ ] Java
- [ ] Dart
- [ ] Rust

### Credits / Acknowledgments

Thanks goes to these wonderful people (and AI assistants) for their contributions:

- Vijay Gangatharan
- Claude (Anthropic)
- The [VS Code Extension API](https://code.visualstudio.com/api) team for excellent documentation.
- All contributors and users who provide feedback.

### License

This project is licensed under the [MIT License](LICENSE).
