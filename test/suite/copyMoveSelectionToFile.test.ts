import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { useTempDir } from './tempDir';

const tmpDir = useTempDir();

async function openTsFile(content: string): Promise<vscode.TextDocument> {
  const tmpFile = path.join(tmpDir(), `acm-sel-test-${Date.now()}.ts`);
  await fs.writeFile(tmpFile, content, 'utf-8');
  const doc = await vscode.workspace.openTextDocument(tmpFile);
  await vscode.window.showTextDocument(doc);
  return doc;
}

async function openDoc(content: string, language = 'typescript') {
  const doc = await vscode.workspace.openTextDocument({ content, language });
  await vscode.window.showTextDocument(doc);
  return doc;
}

suite('Copy Selection to File', () => {
  test('should register the command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.copySelectionToFile'),
      'copySelectionToFile command should be registered',
    );
  });

  test('should not throw when a selection is active on a real file', async () => {
    const content = `import { useState } from 'react';\n\nconst value = 42;`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(2, 0, 2, content.split('\n')[2]!.length);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copySelectionToFile')),
    );
  });

  test('should handle empty selection gracefully', async () => {
    await openDoc(`const x = 1;`);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copySelectionToFile')),
    );
  });

  test('should not throw when copying selection to file', async () => {
    const content = `import { useState } from 'react';\nimport { useEffect } from 'react';\n\nconst Component = () => null;`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    const lines = content.split('\n');
    editor.selection = new vscode.Selection(3, 0, 3, lines[3]!.length);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copySelectionToFile')),
    );
  });
});

suite('Move Selection to File', () => {
  test('should register the command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.moveSelectionToFile'),
      'moveSelectionToFile command should be registered',
    );
  });

  test('should not throw when a selection is active on a real file', async () => {
    const content = `const helper = () => 'help';`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, content.length);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.moveSelectionToFile')),
    );
  });

  test('should handle empty selection gracefully', async () => {
    await openDoc(`const z = 3;`);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.moveSelectionToFile')),
    );
  });

  test('should not throw when full line is selected', async () => {
    const content = `export const PI = 3.14159;`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, content.length);

    const selectedText = editor.document.getText(editor.selection);
    assert.strictEqual(selectedText, content, 'Full line should be selected');

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.moveSelectionToFile')),
    );
  });
});
