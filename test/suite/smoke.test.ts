import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Extension Smoke Test', () => {
  test('should activate successfully', async () => {
    const ext = vscode.extensions.getExtension('VijayGangatharan.additional-context-menus');
    assert.ok(ext, 'Extension should be registered');
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true, 'Extension should be active');
  });
});
