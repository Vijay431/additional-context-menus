import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';

async function openTsFile(content: string): Promise<vscode.TextDocument> {
  // Write to a real .ts temp file so TypeScript parser recognises the extension
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `acm-test-${Date.now()}.ts`);
  await fs.writeFile(tmpFile, content, 'utf-8');
  const doc = await vscode.workspace.openTextDocument(tmpFile);
  await vscode.window.showTextDocument(doc);
  return doc;
}

suite('Copy Function', () => {
  test('should copy function text to clipboard when cursor is inside function', async () => {
    const content = `function greet(name: string): string {\n  return 'Hello ' + name;\n}`;
    const doc = await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(1, 2, 1, 2);

    await Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copyFunction'));

    const clipboard = await vscode.env.clipboard.readText();
    assert.ok(clipboard.includes('greet'), 'Clipboard should contain function name');
  });

  test('should not throw when cursor is outside any function', async () => {
    const content = `const x = 1;\nconst y = 2;`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copyFunction')),
    );
  });

  test('should detect innermost function when cursor is in nested function', async () => {
    const content = `function outer() {\n  function inner() {\n    return 42;\n  }\n  return inner();\n}`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(2, 4, 2, 4);

    await Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copyFunction'));

    const clipboard = await vscode.env.clipboard.readText();
    assert.ok(clipboard.includes('inner'), 'Should copy innermost function');
  });

  test('should handle arrow function', async () => {
    const content = `const add = (a: number, b: number) => {\n  return a + b;\n};`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(1, 2, 1, 2);

    await Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copyFunction'));

    const clipboard = await vscode.env.clipboard.readText();
    assert.ok(clipboard.includes('add'), 'Should copy arrow function');
  });
});
