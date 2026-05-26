<div align="center">
<img src="./public/images/screenshots/logo.png" alt="Logo" width="100"/>
</div>

# Additional Context Menus

[![CI](https://github.com/Vijay431/additional-context-menus/actions/workflows/ci.yml/badge.svg)](https://github.com/Vijay431/additional-context-menus/actions/workflows/ci.yml) [![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus) [![Open VSX Registry](https://img.shields.io/open-vsx/v/VijayGangatharan/additional-context-menus)](https://open-vsx.org/extension/VijayGangatharan/additional-context-menus) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Supercharge your development with intelligent right-click menus for file operations and code refactoring.

## 1. About the Project

**Why it was built:**
Developers often waste time doing repetitive, manual code refactoring—like extracting a function from one file, pasting it into another, and cleaning up missing imports. This extension was built to automate these repetitive file and code operations directly from the VS Code context menu, so developers can stay in flow.

**Key Features:**

- **AST-Based Function Extraction:** Extract and move functions precisely in one click.
- **Smart Import Management:** Automatically merge or duplicate existing imports when copying/moving selected code to a new file.
- **Save All & Terminal Integration:** Execute bulk save operations securely or launch terminals at any file's specific directory.
- **Generators:** Generate TypeScript Enums, interactive Cron expressions, and `.env` template files.
- **File System Workflows:** Rename files to common naming conventions, duplicate them, or copy their contents from the Explorer.

**Tech Stack:**

- TypeScript
- VS Code Extension API
- Node.js
- TypeScript Compiler API (for AST parsing)

## 2. Setup & Installation

**Prerequisites:**

- **VS Code**: Version 1.111.0 or higher.
- A workspace containing source code files (supports Node.js, React, Angular, Next.js, and general TS/JS).

**Installation Steps:**

1. Open Visual Studio Code.
2. Open the Command Palette (`Ctrl+P` on Windows/Linux or `Cmd+P` on macOS).
3. Type the following command and press Enter:
   ```bash
   ext install VijayGangatharan.additional-context-menus
   ```
   Alternatively, search for **Additional Context Menus** in the VS Code Extensions View and click **Install**.

## 3. Usage

The extension exposes a number of new options via the right-click context menu.

**Example 1: Extracting a Function**

1. Position your cursor inside any function in a `.ts` or `.js` file.
2. Right-click to open the context menu.
3. Select **Additional Context Menus** ▶ **Move Function to File**.
4. Choose the target destination. The function will be relocated instantly.

**Example 2: Moving Selected Code with Imports**

1. Highlight a block of code spanning multiple lines.
2. Right-click and choose **Additional Context Menus** ▶ **Move Selection to File**.
3. Select the target file. Existing relevant imports from the source file will automatically be merged into the target file.

## 4. Getting Help & Contributing

**Troubleshooting / FAQs:**

- _Context Menus aren't showing up?_ Make sure you are right-clicking inside an active editor tab with a supported file type (e.g., `.ts`, `.tsx`, `.js`, `.jsx`).
- _Function extraction isn't precise?_ Make sure the file has valid syntax, as the AST parser requires compileable code.

**Contributing:**
We welcome contributions! Please review our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines. You can submit bug reports and feature requests by opening an issue on GitHub.

**Contact:**
Maintainer: Vijay Gangatharan (vijayanand431@gmail.com)

## 5. Additional Sections

**Roadmap:**
Future updates will focus on extending language support beyond the JavaScript/TypeScript ecosystem. Planned support includes:

- [ ] Go language
- [ ] Python language
- [ ] .NET language
- [ ] Java language
- [ ] Dart language
- [ ] Rust language

**Credits:**
Special thanks to the [VS Code Extension API Documentation](https://code.visualstudio.com/api) and the community for providing excellent feedback.

**License:**
This project is licensed under the [MIT License](LICENSE).
