import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { useTempDir } from './tempDir';

const tmpDir = useTempDir();

suite('Duplicate File', () => {
  test('should register the command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('additionalContextMenus.duplicateFile'),
      'duplicateFile command should be registered',
    );
  });

  test('should create a duplicate file with -duplicate suffix', async () => {
    const content = 'const x = 1;\n';
    const fileName = `acm-dup-${Date.now()}.ts`;
    const filePath = path.join(tmpDir(), fileName);
    await fs.writeFile(filePath, content, 'utf-8');

    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('additionalContextMenus.duplicateFile', uri);

    const nameWithoutExt = path.basename(fileName, '.ts');
    const duplicatePath = path.join(tmpDir(), `${nameWithoutExt}-duplicate.ts`);

    const duplicateContent = await fs.readFile(duplicatePath, 'utf-8');
    assert.strictEqual(
      duplicateContent,
      content,
      'Duplicate file should have same content as original',
    );
  });

  test('should auto-increment when duplicate already exists', async () => {
    const content = 'const x = 1;\n';
    const fileName = `acm-dup-inc-${Date.now()}.ts`;
    const filePath = path.join(tmpDir(), fileName);
    await fs.writeFile(filePath, content, 'utf-8');

    const nameWithoutExt = path.basename(fileName, '.ts');
    const duplicatePath = path.join(tmpDir(), `${nameWithoutExt}-duplicate.ts`);
    const duplicate1Path = path.join(tmpDir(), `${nameWithoutExt}-duplicate-1.ts`);

    const uri = vscode.Uri.file(filePath);

    // First duplicate
    await vscode.commands.executeCommand('additionalContextMenus.duplicateFile', uri);

    // Second duplicate of the same original
    await vscode.commands.executeCommand('additionalContextMenus.duplicateFile', uri);

    const duplicateContent = await fs.readFile(duplicatePath, 'utf-8');
    const duplicate1Content = await fs.readFile(duplicate1Path, 'utf-8');

    assert.strictEqual(
      duplicateContent,
      content,
      'First duplicate should have same content as original',
    );
    assert.strictEqual(
      duplicate1Content,
      content,
      'Second duplicate should have same content as original',
    );
  });

  test('should not modify the original file', async () => {
    const content = 'const x = 1;\n';
    const fileName = `acm-dup-orig-${Date.now()}.ts`;
    const filePath = path.join(tmpDir(), fileName);
    await fs.writeFile(filePath, content, 'utf-8');

    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('additionalContextMenus.duplicateFile', uri);

    const originalContent = await fs.readFile(filePath, 'utf-8');
    assert.strictEqual(originalContent, content, 'Original file contents should be unchanged');

    const nameWithoutExt = path.basename(fileName, '.ts');
    const duplicatePath = path.join(tmpDir(), `${nameWithoutExt}-duplicate.ts`);
  });

  test('should not throw when called on a non-existent file', async () => {
    const uri = vscode.Uri.file(path.join(tmpDir(), 'acm-nonexistent-duplicate.ts'));
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('additionalContextMenus.duplicateFile', uri)),
    );
  });
});
