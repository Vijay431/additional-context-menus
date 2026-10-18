import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { useTempDir } from './tempDir';

const tmpDir = useTempDir();

suite('Copy File Contents', () => {
  test('should register the command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.copyFileContents'),
      'copyFileContents command should be registered',
    );
  });

  test('should copy file contents to clipboard', async () => {
    const content = 'const hello = "world";\nexport default hello;\n';
    const filePath = path.join(tmpDir(), `acm-copy-contents-${Date.now()}.ts`);
    await fs.writeFile(filePath, content, 'utf-8');

    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('additionalContextMenus.copyFileContents', uri);

    const clipboard = await vscode.env.clipboard.readText();
    assert.strictEqual(clipboard, content, 'Clipboard should contain the exact file contents');
  });

  test('should copy contents of a file with multiple lines', async () => {
    const content = [
      'import { Component } from "@angular/core";',
      '',
      '@Component({ selector: "app-root" })',
      'export class AppComponent {}',
      '',
    ].join('\n');
    const filePath = path.join(tmpDir(), `acm-copy-multiline-${Date.now()}.ts`);
    await fs.writeFile(filePath, content, 'utf-8');

    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('additionalContextMenus.copyFileContents', uri);

    const clipboard = await vscode.env.clipboard.readText();
    assert.strictEqual(clipboard, content);
  });

  test('should not throw when file does not exist', async () => {
    const uri = vscode.Uri.file(path.join(tmpDir(), 'acm-nonexistent-file.ts'));
    await assert.doesNotReject(
      Promise.resolve(
        vscode.commands.executeCommand('additionalContextMenus.copyFileContents', uri),
      ),
    );
  });
});
