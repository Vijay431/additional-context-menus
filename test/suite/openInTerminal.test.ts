import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { useTempDir } from './tempDir';

const tmpDir = useTempDir();

async function openTsFile(content: string): Promise<vscode.TextDocument> {
  const tmpFile = path.join(tmpDir(), `acm-terminal-test-${Date.now()}.ts`);
  await fs.writeFile(tmpFile, content, 'utf-8');
  const doc = await vscode.workspace.openTextDocument(tmpFile);
  await vscode.window.showTextDocument(doc);
  return doc;
}

suite('Open in Terminal', () => {
  test('should register the openInTerminal command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.openInTerminal'),
      'openInTerminal command should be registered',
    );
  });

  test('should execute without error when a file is open', async () => {
    await openTsFile('const x = 1;');
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.openInTerminal')),
    );
  });

  test('should open a new integrated terminal when invoked', async () => {
    await openTsFile('const hello = () => "world";');

    const terminalsBefore = vscode.window.terminals.length;

    await vscode.commands.executeCommand('additionalContextMenus.openInTerminal');

    // Give VS Code a moment to create the terminal
    await new Promise((r) => setTimeout(r, 500));

    assert.ok(
      vscode.window.terminals.length > terminalsBefore,
      `Expected terminal count to increase from ${terminalsBefore}`,
    );
  });

  test('should execute without error when no active editor', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.openInTerminal')),
    );
  });
});
