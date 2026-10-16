import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';

const createdTmpFiles: string[] = [];

async function openTsFile(content: string): Promise<vscode.TextDocument> {
  const tmpFile = path.join(os.tmpdir(), `acm-fn-test-${Date.now()}.ts`);
  await fs.writeFile(tmpFile, content, 'utf-8');
  createdTmpFiles.push(tmpFile);
  const doc = await vscode.workspace.openTextDocument(tmpFile);
  await vscode.window.showTextDocument(doc);
  return doc;
}

suiteTeardown(async () => {
  for (const f of createdTmpFiles) {
    await fs.unlink(f).catch(() => {});
  }
});

suite('Copy Function to File', () => {
  test('should register the copyFunctionToFile command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.copyFunctionToFile'),
      'copyFunctionToFile command should be registered',
    );
  });

  test('should not throw when cursor is inside a function', async () => {
    await openTsFile(`export function helper(x: number): number {\n  return x * 2;\n}`);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(1, 2, 1, 2);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copyFunctionToFile')),
    );
  });

  test('should not throw when cursor is outside a function', async () => {
    await openTsFile(`const x = 1;`);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.copyFunctionToFile')),
    );
  });

  test('should detect function at cursor and expose it to the command handler', async () => {
    // Verify that the underlying CodeAnalysisService detects the function
    // (used by the command before showing QuickPick)
    const content = `export function transform(s: string): string {\n  return s.trim();\n}`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(1, 2, 1, 2);

    const { CodeAnalysisService } = require('../../src/services/codeAnalysisService');
    const svc = CodeAnalysisService.getInstance();
    const fnInfo = await svc.findFunctionAtPosition(editor.document, editor.selection.active);

    assert.ok(fnInfo, 'Should find function at cursor position');
    assert.ok(fnInfo.name === 'transform', `Expected "transform", got "${fnInfo?.name}"`);
  });
});

suite('Move Function to File', () => {
  test('should register the moveFunctionToFile command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.moveFunctionToFile'),
      'moveFunctionToFile command should be registered',
    );
  });

  test('should not throw when cursor is inside a function', async () => {
    await openTsFile(`export function transform(s: string): string {\n  return s.trim();\n}`);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(1, 2, 1, 2);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.moveFunctionToFile')),
    );
  });

  test('should not throw when cursor is outside a function', async () => {
    await openTsFile(`const y = 2;`);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.moveFunctionToFile')),
    );
  });

  test('should detect arrow function at cursor for move operation', async () => {
    const content = `const multiply = (a: number, b: number): number => {\n  return a * b;\n};`;
    await openTsFile(content);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(1, 2, 1, 2);

    const { CodeAnalysisService } = require('../../src/services/codeAnalysisService');
    const svc = CodeAnalysisService.getInstance();
    const fnInfo = await svc.findFunctionAtPosition(editor.document, editor.selection.active);

    assert.ok(fnInfo, 'Should find arrow function at cursor position');
    assert.strictEqual(fnInfo!.name, 'multiply');
  });
});
