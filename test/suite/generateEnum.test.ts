import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { useTempDir } from './tempDir';

const tmpDir = useTempDir();

async function openTsFile(content: string): Promise<vscode.TextDocument> {
  const tmpFile = path.join(tmpDir(), `acm-enum-test-${Date.now()}.ts`);
  await fs.writeFile(tmpFile, content, 'utf-8');
  const doc = await vscode.workspace.openTextDocument(tmpFile);
  await vscode.window.showTextDocument(doc);
  return doc;
}

suite('Generate Enum', () => {
  test('should register the generateEnum command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.generateEnum'),
      'generateEnum command should be registered',
    );
  });

  test('should handle empty selection gracefully', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: '', language: 'typescript' });
    await vscode.window.showTextDocument(doc);
    const editor = vscode.window.activeTextEditor!;
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.generateEnum')),
    );
  });

  test('should handle selection that is not a union type gracefully', async () => {
    await openTsFile('const x = 1;\nconst y = 2;');
    const editor = vscode.window.activeTextEditor!;
    // Select the non-union text
    editor.selection = new vscode.Selection(0, 0, 0, 12);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.generateEnum')),
    );
  });
});
