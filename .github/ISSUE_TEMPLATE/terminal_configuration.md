---
name: Terminal Configuration Issue
about: Issues with terminal integration and configuration
title: '[TERMINAL] '
labels: terminal, configuration
assignees: ''
---

## Terminal Issue Description

Describe the terminal functionality problem you're experiencing.

**Summary:**
Brief description of the problem.

## Current Configuration

```json
{
  "additionalContextMenus.terminal.type": "",
  "additionalContextMenus.terminal.externalTerminalCommand": "",
  "additionalContextMenus.terminal.openBehavior": ""
}
```

**Custom Command (if using external terminal):**

```
[Paste your externalTerminalCommand]
```

## Expected vs Actual Behavior

**Expected:** What should happen when using "Open in Terminal"
**Actual:** What actually happens

## Platform Information

- **OS:** Windows/macOS/Linux (specify version)
- **VS Code:** Version (e.g., 1.102.0)
- **Extension:** Version (e.g., 2.0.0)
- **Default Terminal:** Command Prompt/PowerShell/Terminal.app/gnome-terminal/etc.

## Terminal Type Testing (test and mark)

- [ ] **Integrated Terminal**: ✅ Works / ❌ Fails - [Description]
- [ ] **External Terminal**: ✅ Works / ❌ Fails - [Description]
- [ ] **System Default**: ✅ Works / ❌ Fails - [Description]

**For External Terminal (if applicable):**

**Terminal Application:**

- [ ] Windows Terminal
- [ ] Command Prompt (cmd)
- [ ] PowerShell
- [ ] Terminal.app
- [ ] iTerm2
- [ ] gnome-terminal
- [ ] konsole
- [ ] xfce4-terminal
- [ ] xterm
- [ ] Other: **\*\***\_\_\_\_**\*\***

**Command Template:**

```
[Paste the exact terminal command being executed]
```

**Command Works Manually?**

- [ ] Yes, command works when run manually
- [ ] No, command fails manually too
- [ ] Haven't tested manually

## Directory Behavior Testing (test and mark)

- [ ] **Parent Directory**: ✅ Works / ❌ Fails - [Description]
- [ ] **Workspace Root**: ✅ Works / ❌ Fails - [Description]
- [ ] **Current Directory**: ✅ Works / ❌ Fails - [Description]

**Directory Path:**
What directory should open?

```
[Expected directory path]
```

**Actual Directory:**
What directory actually opens?

```
[Actual directory path]
```

## Error Messages (if any)

```bash
[Paste error messages from VS Code Console, Output Channel, or system dialogs]
```

**VS Code Output Channel:**

```
[Paste output from "Additional Context Menus" output channel]
```

## Debug Information

**Extension State:**

- [ ] Extension is enabled
- [ ] Extension is disabled

**Terminal Service Status:**
Run "Additional Context Menus: Show Output Channel" and paste any terminal-related logs.

## Context

**File Being Used:**
When you right-click to open terminal, what file are you clicking on?

**Project Structure:**
Describe your project structure if relevant.

**Multiple Workspaces:**

- [ ] Single workspace
- [ ] Multi-root workspace
- [ ] Remote workspace (SSH/WSL/Container)

## Reproduction Steps

1. Right-click on **\*\***\_\_\_\_**\*\*** file
2. Select "Open in Terminal"
3. Terminal should open in **\*\***\_\_\_\_**\*\***
4. Actually see: **\*\***\_\_\_\_**\*\***

## Additional Context

**Workarounds:**
Are there any workarounds that work?

- [ ] Use integrated terminal instead
- [ ] Use system default instead
- [ ] Manually open terminal in VS Code
- [ ] Other: **\*\***\_\_\_\_**\*\***

**Configuration History:**

- [ ] Just installed extension
- [ ] Was working before, broke after **\*\***\_\_\_\_**\*\***
- [ ] Never worked

**Related Issues:**
Link to related terminal issues.

## Priority

How critical is this terminal issue?

- [ ] Critical - Can't use terminal integration at all
- [ ] High - Important terminal functionality broken
- [ ] Medium - Minor terminal issue
- [ ] Low - Minor inconvenience

---

**Thank you for reporting terminal issues!** 🖥️
