import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Generate .env File', () => {
  test('should register the generateEnvFile command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.generateEnvFile'),
      'generateEnvFile command should be registered',
    );
  });

  test('should execute without throwing when no workspace is open', async () => {
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.generateEnvFile')),
    );
  });
});
