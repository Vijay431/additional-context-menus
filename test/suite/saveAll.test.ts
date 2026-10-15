import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';

async function openTsFile(
  content: string,
): Promise<{ doc: vscode.TextDocument; filePath: string }> {
  const filePath = path.join(os.tmpdir(), `acm-save-test-${Date.now()}.ts`);
  await fs.writeFile(filePath, content, 'utf-8');
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);
  return { doc, filePath };
}

suite('Save All', () => {
  test('should register the saveAll command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.saveAll'),
      'saveAll command should be registered',
    );
  });

  test('should execute without error when no dirty files', async () => {
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.saveAll')),
    );
  });

  test('should save a dirty document and mark it clean', async () => {
    const { doc } = await openTsFile('const initial = 1;');

    // Make the document dirty via a workspace edit
    const edit = new vscode.WorkspaceEdit();
    edit.insert(doc.uri, new vscode.Position(0, 0), '// edited\n');
    await vscode.workspace.applyEdit(edit);

    assert.ok(doc.isDirty, 'Document should be dirty after edit');

    const saved = new Promise<void>((resolve) => {
      const disposable = vscode.workspace.onDidSaveTextDocument((saved) => {
        if (saved.uri.toString() === doc.uri.toString()) {
          disposable.dispose();
          resolve();
        }
      });
      // 5-second fallback in case the event doesn't fire
      setTimeout(() => {
        disposable.dispose();
        resolve();
      }, 5000);
    });

    await vscode.commands.executeCommand('additionalContextMenus.saveAll');
    await saved;

    assert.ok(!doc.isDirty, 'Document should not be dirty after saveAll');
  });

  test('should execute without error when an untitled document is open', async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: 'const x = 1;',
      language: 'typescript',
    });
    await vscode.window.showTextDocument(doc);

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.saveAll')),
    );
  });
});
