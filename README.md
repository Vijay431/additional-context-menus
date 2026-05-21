# Additional Context Menus - VS Code Extension

🚀 **Enhanced right-click context menus for Node.js development** with intelligent code operations for React, Angular, Express, Next.js, TypeScript, and JavaScript projects.

[![CI](https://github.com/Vijay431/additional-context-menus/actions/workflows/ci.yml/badge.svg)](https://github.com/Vijay431/additional-context-menus/actions/workflows/ci.yml) [![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus) [![Open VSX Registry](https://img.shields.io/open-vsx/v/VijayGangatharan/additional-context-menus)](https://open-vsx.org/extension/VijayGangatharan/additional-context-menus) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Installs](https://vsmarketplacebadges.dev/installs-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus) [![Downloads](https://vsmarketplacebadges.dev/downloads-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus) [![Rating](https://vsmarketplacebadges.dev/rating-short/VijayGangatharan.additional-context-menus.svg)](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus&ssr=false#review-details)

**Additional Context Menus** is a free, open-source VS Code extension that adds powerful right-click actions for everyday TypeScript and JavaScript work. Extract and move functions with AST-based precision, copy or move selections between files with automatic import merging, generate TypeScript enums, `.env` files, and cron expressions, and run file operations such as duplicate, rename-to-convention, and copy-contents — all without leaving the editor. Built for React, Angular, Express, and Next.js developers who want to refactor faster and stay in flow.

## ⬇️ Install in 30 seconds

- **VS Code Marketplace** — [Install Additional Context Menus](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus), or run `ext install VijayGangatharan.additional-context-menus` from Quick Open (`Ctrl+P` / `Cmd+P`)
- **Open VSX Registry** (VSCodium, Cursor, Gitpod, Windsurf) — [view the Open VSX listing](https://open-vsx.org/extension/VijayGangatharan/additional-context-menus)
- **Command line** — `code --install-extension VijayGangatharan.additional-context-menus`

<div align="center">

![Copy Function demo: with the cursor inside a TypeScript function, choosing Copy Function from the right-click menu copies the entire function in one click](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/copy-function.gif)
_Extract functions in one click with intelligent import handling_

</div>

---

## 🎯 Quick Start

**New to Additional Context Menus?** Get productive in 2 minutes:

1. **Install** the extension from VS Code Marketplace
2. **Open** any Node.js project with `package.json`
3. **Right-click** in any file → look for **Additional Context Menus ▶** in the context menu
4. **Try it out:** Select some code → Right-click → Additional Context Menus → "Copy Selection to File"

### 💡 Common Workflows

| Workflow                     | Steps                                                    | When to Use                            |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------- |
| **Extract React Component**  | Select JSX → Right-click → Copy/Move to File             | Refactoring large components           |
| **Share Utility Function**   | Click in function → Right-click → Copy Function          | Reusing helper functions               |
| **Copy Function to File**    | Cursor in function → Right-click → Copy Function to File | Extracting functions to separate files |
| **Move Function to File**    | Cursor in function → Right-click → Move Function to File | Refactoring function extraction        |
| **Quick Terminal Access**    | Right-click anywhere → Open in Terminal                  | Fast directory navigation              |
| **Bulk Save Modified Files** | Right-click → Save All                                   | Before commits or builds               |

---

## 🎬 Feature Showcase

<details>
<summary>See all feature demos (8 GIFs)</summary>

### Copy Function

![Copy Function demo: copying a whole function to the clipboard from the editor right-click menu](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/copy-function.gif)

### Copy Function to File

![Copy Function to File demo: picking a target file and inserting the function at a smart location](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/copy-function-to-file.gif)

### Move Function to File

![Move Function to File demo: moving a function into another file and removing it from the source](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/move-function-to-file.gif)

### Copy Selection to File

![Copy Selection to File demo: copying selected code into another file with imports merged automatically](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/copy-selection-to-file.gif)

### Move Selection to File

![Move Selection to File demo: moving a selected code block to another file with automatic import handling](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/move-selection-to-file.gif)

### Save All

![Save All demo: saving every modified editor at once with a progress summary](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/save-all.gif)

### Open in Terminal

![Open in Terminal demo: opening an integrated terminal at the right-clicked file's directory](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/open-in-terminal.gif)

### Rename File to Convention

![Rename File to Convention demo: renaming a file to kebab-case from the Explorer right-click menu](https://raw.githubusercontent.com/Vijay431/additional-context-menus/main/public/images/screenshots/rename-file-convention.gif)

</details>

---

## 🌟 Why Additional Context Menus?

**Stop wasting time on manual refactoring:**

| ❌ Manual Refactoring                                            | ✅ With Additional Context Menus        |
| ---------------------------------------------------------------- | --------------------------------------- |
| Select code → find target file → paste → fix up imports by hand  | Right-click → Select target → Done      |
| Context-switch kills momentum                                    | Stay in the editor, stay in the zone    |
| Duplicate or missed imports when moving selections between files | Existing imports merged automatically\* |
| Manually hunt for function boundaries in large files             | AST-based detection finds it in 1 click |

_\* Import merging applies to **Copy/Move Selection to File**. Copy/Move Function commands transfer the function body only._

**Join developers saving hours weekly on routine code operations.**

---

## ✨ Features

All 13 user-facing commands at a glance:

| Feature                   | What it does                                                                  |
| ------------------------- | ----------------------------------------------------------------------------- |
| Copy Function             | Copy the function at the cursor to the clipboard (AST-based detection)        |
| Copy Function to File     | Copy the function at the cursor into a target file at a smart insertion point |
| Move Function to File     | Move the function at the cursor into a target file and remove it from source  |
| Copy Selection to File    | Copy selected code into another file with imports merged automatically        |
| Move Selection to File    | Move selected code into another file with automatic import handling           |
| Save All                  | Save all modified editors with progress feedback and read-only handling       |
| Open in Terminal          | Open a terminal at the file's directory (Windows, macOS, Linux)               |
| Rename File to Convention | Rename files/folders to kebab-case, camelCase, or PascalCase via the Explorer |
| Generate Enum             | Convert a TypeScript union type into an enum                                  |
| Generate Cron Expression  | Build a cron expression interactively                                         |
| Generate .env File        | Generate a `.env` file from environment-variable usage in the codebase        |
| Copy File Contents        | Copy an entire file's contents to the clipboard from the Explorer             |
| Duplicate File            | Duplicate a file with auto-incremented naming                                 |

### 🎯 Core Functionality

#### Main Features (Right-Click Menu Only)

- 🎯 **Copy Function** - AST-based function detection and copying with intelligent import handling
- 📋 **Copy Function to File** - Copy function at cursor to a target file
- ✂️ **Move Function to File** - Move function at cursor to a target file (removes from source)
- 📋 **Copy Selection to File** - Smart code copying with import conflict resolution
- ✂️ **Move Selection to File** - Intelligent code moving with automatic cleanup
- 💾 **Save All** - Enhanced save functionality with progress feedback and read-only handling
- 🖥️ **Open in Terminal** - Cross-platform terminal integration
- 🔢 **Generate Enum from Union Type** - Convert TypeScript union types to enums
- ⏱️ **Generate Cron Expression** - Interactive cron expression builder
- 🌿 **Generate .env File** - Generate environment file from usage patterns

#### Extension Management (Command Palette Only)

- ⚙️ **Enable/Disable Extension** - Global extension control
- 🔍 **Show Output Channel** - View extension logs
- 🐛 **Debug Context Variables** - Inspect extension state
- 🔄 **Refresh Context Variables** - Force re-detection of project context
- ⌨️ **Check Keybinding Conflicts** - View keybinding configuration
- 🔛 **Enable/Disable Keybindings** - Toggle custom keybindings

#### Explorer Right-Click Menu

- 🗂️ **Rename File to Convention** - Right-click any file or folder in the Explorer to rename to kebab-case, camelCase, or PascalCase. Processes a single file or recursively renames all files in a folder. Reports renamed, skipped (already compliant), and failed counts.
- 📋 **Copy File Contents** - Copy the entire contents of any file to the clipboard directly from the Explorer, no editor tab needed
- 📁 **Duplicate File** - Duplicate any file from the Explorer with a single right-click — auto-increments the name if the duplicate already exists

### Project Intelligence

- 🔍 **Automatic Project Detection** - Detects React, Angular, Express, and Next.js projects
- 📁 **Smart File Discovery** - Finds compatible files for code operations
- 🔧 **Context-Aware Menus** - Shows relevant options based on file type and project
- 📝 **TypeScript & JavaScript Support** - Full support for .ts, .tsx, .js, .jsx files

### Code Operations

- 🧠 **AST-Based Code Analysis** - Uses TypeScript Compiler API for accurate function detection
- 🔀 **Import Management** - Merge, duplicate, or skip import statements
- 📍 **Smart Insertion** - Intelligent code placement (smart, end, beginning)
- 💬 **Comment Preservation** - Maintains code comments during operations

### Accessibility

- 🔍 **Dual Access Patterns** - Main features accessible via both command palette and right-click menu
- ⚙️ **Management Commands** - Enable/disable functionality available via command palette only
- 🎯 **Context-Aware Display** - Menus shown based on file type and extension state; function-specific items appear only when cursor is inside a function
- 🌐 **Cross-Platform Terminal** - Intelligent terminal integration across Windows, macOS, and Linux
- ♿ **Screen Reader Support** - ARIA labels and announcements for assistive technology users
- 🎹 **Keyboard Navigation** - All features fully keyboard accessible with enhanced hints
- ⚙️ **Configurable Verbosity** - Adjust screen reader announcement levels (minimal, normal, verbose)

#### Keyboard Shortcuts

| Command                | Windows/Linux      | macOS             |
| ---------------------- | ------------------ | ----------------- |
| Copy Function          | `Ctrl+Alt+Shift+F` | `Cmd+Alt+Shift+F` |
| Copy Function to File  | `Ctrl+Alt+Shift+E` | `Cmd+Alt+Shift+E` |
| Copy Selection to File | `Ctrl+Alt+Shift+C` | `Cmd+Alt+Shift+C` |
| Move Function to File  | `Ctrl+Alt+Shift+R` | `Cmd+Alt+Shift+R` |
| Move Selection to File | `Ctrl+Alt+Shift+M` | `Cmd+Alt+Shift+M` |
| Save All               | `Ctrl+Alt+Shift+A` | `Cmd+Alt+Shift+A` |
| Open in Terminal       | `Ctrl+Alt+Shift+T` | `Cmd+Alt+Shift+T` |

<details>
<summary>♿ Accessibility Settings & Screen Reader Support</summary>

- `additionalContextMenus.accessibility.verbosity` — `minimal` / `normal` (default) / `verbose`
- `additionalContextMenus.accessibility.screenReaderMode` — enhanced ARIA labels (default: `false`)
- `additionalContextMenus.accessibility.keyboardNavigation` — keyboard hints in Quick Pick (default: `true`)

Supports NVDA (Windows), VoiceOver (macOS), Orca (Linux). All Quick Pick items include ARIA labels; long-running operations announce progress percentage. See the [Accessibility](#accessibility) features and the **Extension Settings** section below for full details.

</details>

---

## 📦 Installation

### From VS Code Marketplace

1. Open Visual Studio Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS)
3. Type `ext install VijayGangatharan.additional-context-menus`
4. Press Enter

### From Command Line

```bash
code --install-extension VijayGangatharan.additional-context-menus
```

### Pre-release Versions

Pre-release builds are published to both VS Code Marketplace and Open VSX Registry for early access to new features before a stable release.

**VS Code Marketplace:**

1. Open the extension page in VS Code
2. Click the dropdown arrow next to **Uninstall**
3. Select **Switch to Pre-Release Version**

**Open VSX Registry:**
Pre-release versions are listed alongside stable versions on the extension page.

Pre-release tags carry a suffix (e.g. `v2.1.0-beta.1`, `v2.1.0-rc.1`). Stable releases omit the suffix (e.g. `v2.1.0`). The beta and its stable graduation share the same MAJOR.MINOR.PATCH core — `package.json` version stays unchanged when graduating from pre-release to stable.

---

## 📖 Usage Guide

The extension automatically detects Node.js projects and enhances right-click context menus for supported file types.

<details>
<summary>🎬 Feature Demonstrations (before & after examples)</summary>

#### Copy Function - Before & After

**Before:** Manual copy-paste — scroll to function, select boundaries, switch file, paste, fix indentation

```typescript
// In ComponentA.tsx - you want to copy this function
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

**After:** Cursor inside the function → right-click → Copy Function — function text copied to clipboard

```typescript
// Pasted into ComponentB.tsx - function body transferred exactly
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

> **Note:** Copy Function / Copy Function to File transfers the function body only. Add the import in the target file manually (or use Copy Selection to File for automatic import merging).

#### Code Migration - React Component Example

**Scenario:** Moving a custom hook from component to shared utilities

**Before:** Complex manual refactoring

```typescript
// Large component file with embedded hook
const UserProfile = () => {
  // Custom hook buried in component
  const useUserData = (userId: string) => {
    // Complex hook logic...
  };

  return <div>Profile Content</div>;
};
```

**After:** Clean separation with Move Function to File

```typescript
// hooks/useUserData.ts - Moved via context menu (function body only)
export const useUserData = (userId: string) => {
  // Hook logic properly extracted
};

// UserProfile.tsx - import added manually after move
import { useUserData } from '../hooks/useUserData';

const UserProfile = () => {
  const userData = useUserData(currentUser.id);
  return <div>Profile Content</div>;
};
```

</details>

### 🔧 Detailed Feature Usage

#### Copy Function

1. **Position cursor** inside any function (arrow, regular, method, React component)
2. **Right-click** → Select "Copy Function"
3. **Automatic detection** of function boundaries using AST-based parsing via TypeScript Compiler API
4. **Smart copying** includes function signature, body, and relevant comments

**Supported Function Types:**

- ✅ Regular functions: `function myFunc() {}`
- ✅ Arrow functions: `const myFunc = () => {}`
- ✅ Class methods: `methodName() {}`
- ✅ React components: `const MyComponent = () => {}`
- ✅ React hooks: `const useCustomHook = () => {}`
- ✅ Async functions: `async function fetchData() {}`

#### Copy/Move Code

1. **Select** the code block you want to transfer
2. **Right-click** → Choose "Copy Selection to File" or "Move Selection to File"
3. **Browse** compatible files (smart filtering by extension)
4. **Select target** from organized file list with last-modified timestamps
5. **Smart insertion** with configurable placement (smart/beginning/end)

**Smart Features:**

- 🧠 **Import Merging**: Existing import statements from the source are merged into the target file (deduplicates where possible)
- 📍 **Intelligent Placement**: Finds optimal insertion point after imports, before exports
- 💬 **Comment Preservation**: Maintains code comments during transfer
- 🔍 **File Discovery**: Shows only compatible files (.ts↔.tsx, .js↔.jsx)

#### Save All

- **Right-click anywhere** → Select "Save All"
- **Progress feedback** for operations with 5+ files
- **Smart filtering** skips read-only files (configurable)
- **Detailed reporting** shows success/failure/skipped counts
- **Error handling** continues operation even if some files fail

#### Open in Terminal

1. **Right-click** on any file in the editor
2. **Select** "Open in Terminal" from context menu
3. **Smart directory selection** based on configuration:
   - **Parent Directory**: Opens folder containing the file
   - **Workspace Root**: Opens project root directory
   - **Current Directory**: Opens the file's exact location

**Cross-Platform Terminal Support:**

- 🪟 **Windows**: cmd, PowerShell, Windows Terminal
- 🍎 **macOS**: Terminal.app, iTerm2, custom terminals
- 🐧 **Linux**: gnome-terminal, konsole, xfce4-terminal, xterm
- ⚙️ **Custom**: Configure any terminal with command templates

---

## 🎮 Commands & Shortcuts

### Command Palette Integration

Access management and utility features via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

**Right-Click Menu Only** (hidden from Command Palette):

- `additionalContextMenus.copyFunction` - Copy Function
- `additionalContextMenus.copyFunctionToFile` - Copy Function to File
- `additionalContextMenus.moveFunctionToFile` - Move Function to File
- `additionalContextMenus.copySelectionToFile` - Copy Selection to File
- `additionalContextMenus.moveSelectionToFile` - Move Selection to File
- `additionalContextMenus.generateEnum` - Generate Enum from Union Type
- `additionalContextMenus.generateCronTimer` - Generate Cron Expression

**Command Palette Accessible**:

- `Additional Context Menus: Enable` - Enable the extension
- `Additional Context Menus: Disable` - Disable the extension
- `Additional Context Menus: Save All` - Save all open files
- `Additional Context Menus: Open in Terminal` - Open terminal at file location
- `Additional Context Menus: Show Output Channel` - View extension logs
- `Additional Context Menus: Debug Context Variables` - Inspect extension state
- `Additional Context Menus: Refresh Context Variables` - Force re-detection
- `Additional Context Menus: Check Keybinding Conflicts` - View keybinding config
- `Additional Context Menus: Enable Keybindings` - Enable custom keybindings
- `Additional Context Menus: Disable Keybindings` - Disable custom keybindings
- `Additional Context Menus: Generate .env File` - Generate env file

**Explorer Right-Click**:

- `Additional Context Menus: Rename File to Convention` - Right-click a file or folder in the Explorer to rename to a naming convention

**Keyboard Shortcuts** (active when extension is enabled): see the [Keyboard Shortcuts](#keyboard-shortcuts) table above for the full Windows/Linux and macOS bindings.

---

## 📋 Requirements

- **VS Code**: Version 1.111.0 or higher (last 10 minor versions supported)
- **Node.js**: Version 22+ runtime (Node 24 LTS recommended for development)
- **PNPM**: Package manager for dependency management (install with `npm install -g pnpm`)
- **Project Type**: Node.js project with `package.json` (for smart detection)
- **File Types**: TypeScript/JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`)
- **Optional**: Framework dependencies (React, Angular, Express, Next.js) for enhanced features

---

## ⚙️ Extension Settings

### 🎛️ Complete Configuration Reference

Additional Context Menus provides extensive configuration options:

### Core Settings

- `additionalContextMenus.enabled` (boolean, default: `true`) - Enable or disable the extension
- `additionalContextMenus.autoDetectProjects` (boolean, default: `true`) - Automatically detect frameworks (informational)
- `additionalContextMenus.supportedExtensions` (array, default: `[".ts", ".tsx", ".js", ".jsx"]`) - File extensions where context menus will be shown

### Code Copy Settings

- `additionalContextMenus.copyCode.insertionPoint` (string, default: `"smart"`) - Where to insert copied code
  - `"smart"` - Intelligently choose the best location
  - `"end"` - Insert at the end of the file
  - `"beginning"` - Insert at the beginning of the file
- `additionalContextMenus.copyCode.preserveComments` (boolean, default: `true`) - Preserve comments when copying code

### Save All Settings

- `additionalContextMenus.saveAll.showNotification` (boolean, default: `true`) - Show notification after saving all files
- `additionalContextMenus.saveAll.skipReadOnly` (boolean, default: `true`) - Skip read-only files when saving all

### Terminal Settings

- `additionalContextMenus.terminal.type` (string, default: `"integrated"`) - Type of terminal to open
  - `"integrated"` - VS Code's built-in terminal
  - `"external"` - Custom external terminal application
  - `"system-default"` - Platform's default terminal
- `additionalContextMenus.terminal.externalTerminalCommand` (string, default: `""`) - Custom command for external terminal
  - Use `{{directory}}` as placeholder for directory path
  - Examples: `"wt -d {{directory}}"` (Windows Terminal), `"open -a iTerm {{directory}}"` (iTerm2)
- `additionalContextMenus.terminal.openBehavior` (string, default: `"parent-directory"`) - Which directory to open in terminal
  - `"parent-directory"` - Directory containing the file
  - `"workspace-root"` - Root of the workspace
  - `"current-directory"` - The file's directory

<details>
<summary>🖥️ Terminal Configuration Examples</summary>

**Windows Terminal:**

```json
{
  "additionalContextMenus.terminal.type": "external",
  "additionalContextMenus.terminal.externalTerminalCommand": "wt -d {{directory}}",
  "additionalContextMenus.terminal.openBehavior": "parent-directory"
}
```

**iTerm2 (macOS):**

```json
{
  "additionalContextMenus.terminal.type": "external",
  "additionalContextMenus.terminal.externalTerminalCommand": "open -a iTerm {{directory}}",
  "additionalContextMenus.terminal.openBehavior": "workspace-root"
}
```

**GNOME Terminal (Linux):**

```json
{
  "additionalContextMenus.terminal.type": "external",
  "additionalContextMenus.terminal.externalTerminalCommand": "gnome-terminal --working-directory={{directory}}",
  "additionalContextMenus.terminal.openBehavior": "parent-directory"
}
```

**Team/Workspace Recommended Settings:**

```json
{
  "additionalContextMenus.enabled": true,
  "additionalContextMenus.autoDetectProjects": true,
  "additionalContextMenus.copyCode.insertionPoint": "smart",
  "additionalContextMenus.copyCode.preserveComments": true,
  "additionalContextMenus.saveAll.showNotification": true,
  "additionalContextMenus.terminal.type": "integrated"
}
```

</details>

---

## 🧩 Supported Frameworks

The extension auto-detects React, Angular, Express, and Next.js projects for informational purposes; all core operations work in any TypeScript/JavaScript workspace.

<details>
<summary>⚛️ React Projects</summary>

- **Smart Component Detection**: Recognizes functional and class components
- **JSX Support**: Handles JSX syntax in function extraction and copying
- **Hook Extraction**: Specialized support for React hooks (functions starting with `use`)

**Example Use Cases:** extract custom hooks from components, move JSX components between files

</details>

<details>
<summary>🅰️ Angular Projects</summary>

- **Service Detection**: Identifies Angular services and components
- **Decorator Support**: Preserves Angular decorators during code operations
- **TypeScript Integration**: Full TypeScript support for Angular development

**Example Use Cases:** extract services from components, move utility functions, copy component methods

</details>

<details>
<summary>🚂 Express Projects</summary>

- **Route Handler Detection**: Identifies Express route handlers and middleware
- **Server-side Logic**: Optimized for Node.js server development patterns

**Example Use Cases:** extract middleware functions, move route handlers between files

</details>

<details>
<summary>▲ Next.js Projects</summary>

- **Full-Stack Support**: Handles both client and server-side code
- **API Routes**: Special handling for Next.js API route patterns
- **SSR/SSG Functions**: Supports `getServerSideProps`, `getStaticProps`

**Example Use Cases:** extract API route handlers, move page components and data-fetching logic

</details>

<details>
<summary>📝 TypeScript & JavaScript</summary>

- **ES6+ Syntax**: Full support for modern JavaScript features
- **Type Safety**: Maintains TypeScript types during code operations
- **Import/Export**: Smart handling of ES modules and CommonJS
- **JSDoc Support**: Preserves documentation comments

</details>

---

## ❓ Troubleshooting & FAQ

<details>
<summary>Context Menus Not Appearing</summary>

**Problem**: Right-click context menus don't show Additional Context Menus options

**Solutions:**

1. **Verify File Type**: Editor context menus appear only in `.ts`, `.tsx`, `.js`, `.jsx` files (Explorer menus appear for any file)
2. **Extension Status**: Run `Additional Context Menus: Debug Context Variables` to check status
3. **Refresh Detection**: Use `Additional Context Menus: Refresh Context Variables`

</details>

<details>
<summary>Function Detection Issues</summary>

**Problem**: "Copy Function" doesn't detect function at cursor

**Solutions:**

1. **Cursor Position**: Ensure cursor is inside the function body or name
2. **Valid Syntax**: Function must have valid JavaScript/TypeScript syntax
3. **Supported Types**: Check if your function type is supported (see usage guide)
4. **File Extension**: Ensure file has correct extension (`.ts`, `.tsx`, `.js`, `.jsx`)

</details>

<details>
<summary>Terminal Not Opening</summary>

**Problem**: "Open in Terminal" command fails

**Solutions:**

1. **Check Configuration**: Verify terminal settings in VS Code preferences
2. **Platform Support**: Ensure your OS is supported (Windows/macOS/Linux)
3. **External Terminal**: If using external terminal, verify command syntax
4. **Fallback**: Extension automatically falls back to integrated terminal

</details>

<details>
<summary>Import Handling</summary>

**Problem**: Imports not merged when using Copy/Move Selection to File

**Solutions:**

1. **Use the correct command**: Only **Copy/Move Selection to File** merges imports. **Copy/Move Function to File** transfers the function body only — add the import in the target file manually.
2. **File Structure**: Ensure proper ES module or CommonJS structure
3. **Import Style**: Use consistent import style throughout the project

</details>

<details>
<summary>📚 Frequently Asked Questions</summary>

**Q: Can I use this extension in non-Node.js projects?**
A: Yes. Context menus appear in any workspace — no `package.json` required. The `autoDetectProjects` setting identifies frameworks for informational purposes, but does not gate the menus.

**Q: Does this work with other frameworks like Vue or Svelte?**
A: The extension currently detects React, Angular, Express, and Next.js projects. Basic file operations work in any Node.js project, but framework-specific features are limited to supported frameworks.

**Q: How does the extension handle large files?**
A: The extension is optimized for performance and can handle large files. Progress indicators appear for operations with 5+ files.

**Q: Can I customize where code gets inserted?**
A: Yes! Configure `insertionPoint` to "smart" (default), "beginning", or "end" in settings.

</details>

<details>
<summary>🔍 Debugging Steps</summary>

1. **Enable Debug Output**: `Additional Context Menus: Show Output Channel`
2. **Check Extension State**: `Additional Context Menus: Debug Context Variables`
3. **Refresh Detection**: `Additional Context Menus: Refresh Context Variables`
4. **Review Configuration**: Check all settings in VS Code preferences
5. **Report Issues**: Use [GitHub Issues](https://github.com/Vijay431/additional-context-menus/issues) with debug output

</details>

---

## 🐛 Known Issues & Limitations

- **Syntax Requirements**: Function detection requires valid JavaScript/TypeScript syntax
- **Import Merging (Selection only)**: Complex import scenarios may require manual adjustment; Copy/Move Function commands do not merge imports
- **Large Files**: Very large files (>10MB) may experience slower function detection

**Reporting Issues**: Please report problems on our [GitHub repository](https://github.com/Vijay431/additional-context-menus/issues) with:

- VS Code version
- Extension version
- Debug output from `Show Output Channel`
- Steps to reproduce

## Release Notes

### [2.1.0] - Latest

- **📋 Copy File Contents**: Right-click any file in the Explorer to copy its entire contents to the clipboard without opening it
- **📁 Duplicate File**: Right-click any file in the Explorer to create a `<name>-duplicate<ext>` copy alongside the original. Auto-increments if needed.
- **🧪 Full test suite**: Vitest unit tests + Mocha integration tests covering all 13 user-facing commands via `@vscode/test-electron`
- **🔧 Cache TTL fix**: `fileDiscovery.cacheTTL` setting now correctly wired into `FileDiscoveryService`
- **🗑️ Removed** `copyCode.handleImports` setting (was never implemented) and the walkthrough

For older versions, see [CHANGELOG.md](CHANGELOG.md).

---

<details>
<summary>⚡ Performance & Reliability</summary>

**Build Performance:** esbuild compilation ~1 second · near-instant watch mode · tree-shaking removes unused code

**Runtime Performance:**

- **Lazy-Loaded Services**: `codeAnalysisService`, Enum/Env/Cron generators load on first use only
- **Intelligent Caching**: file discovery results cached (configurable TTL)
- **Background Processing**: non-blocking operations
- **Error Boundary Protection**: continues working with malformed code

**Code Quality:** TypeScript strict mode · ESLint · Prettier · integration tests via `@vscode/test-electron`

</details>

## 🏗️ Architecture

### Runtime Architecture

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

### Codebase Structure

```mermaid
flowchart TD
    A["extension"] --> B["managers"]
    B --> C["di\ncontainer, interfaces"]
    C --> D["Feature Services\nFileSaveService\nTerminalService\nFileNamingConventionService"]
    C -.->|"lazy load"| L["Lazy Services\nEnumGeneratorService\nEnvFileGeneratorService\nCronJobTimerGeneratorService"]
    D --> E["utils, types"]
    L --> E
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### 🛠️ Development Setup

**Prerequisites**: Node.js 22+ runtime (22, 24, 26 supported); development uses Node 24 LTS. VS Code 1.111+ required (last 10 minor versions supported).

```bash
# 1. Clone and setup
git clone https://github.com/Vijay431/additional-context-menus.git
cd additional-context-menus
pnpm install

# 2. Build
pnpm run build

# 3. Launch development environment
# Press F5 in VS Code to launch Extension Development Host
```

You can also open the project in GitHub Codespaces or a VS Code Dev Container. The container installs Node.js 24 (latest LTS), pnpm dependencies, recommended VS Code extensions, and Linux packages needed for headless integration tests.

<details>
<summary>📋 Available Development Commands</summary>

| Command                       | Description                                     | Performance              |
| ----------------------------- | ----------------------------------------------- | ------------------------ |
| `pnpm run build`              | Build extension using TypeScript esbuild config | ⚡ ~1 second             |
| `pnpm run watch`              | Watch mode for development                      | 🔄 Instant rebuilds      |
| `pnpm run package`            | Production build with optimizations             | 📦 Optimized             |
| `pnpm run lint`               | Run ESLint on src directory                     | 🎨 Code quality          |
| `pnpm run lint:fix`           | Auto-fix ESLint issues                          | 🔧 Auto-fix              |
| `pnpm run format`             | Format code using Prettier                      | ✨ Consistent style      |
| `pnpm run test:unit`          | Run unit tests (Vitest)                         | ⚡ Fast, no display      |
| `pnpm run test:unit:coverage` | Run unit tests with coverage output             | 📈 LCOV report           |
| `pnpm run test:integration`   | Run integration tests (VS Code, Ubuntu/Linux)   | 🧪 Full feature coverage |

</details>

---

## Contributors

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://allcontributors.org) specification. Contributions of any kind are welcome.

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the full contributors list including AI pair programmers.

## 📄 License

This extension is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Developer

**Vijay Gangatharan**

- 📧 Email: <vijayanand431@gmail.com>
- 🐙 [GitHub Repository](https://github.com/Vijay431/additional-context-menus)
- 🌐 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus)

---

## 🙏 Acknowledgments

Special thanks to:

- The VS Code Extension API team for excellent documentation
- The TypeScript and JavaScript developer communities
- All contributors and users who provide feedback and suggestions

---

## 📈 Extension Stats

- 🔄 **Lazy-Loaded Services** - Generators load on demand
- ⚡ **~1 Second Builds** - esbuild powered

[**Rate this extension on Marketplace** →](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus&ssr=false#review-details)

---

<div align="center">

**🚀 Enjoy productive coding with Additional Context Menus! 🚀**

_If this extension helps your workflow, please consider [leaving a review](https://marketplace.visualstudio.com/items?itemName=VijayGangatharan.additional-context-menus&ssr=false#review-details) ⭐_

</div>
