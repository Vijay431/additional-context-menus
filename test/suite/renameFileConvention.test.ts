import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Rename File to Convention', () => {
  test('should register the command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.renameFileConvention'),
      'renameFileConvention command should be registered',
    );
  });
});
