/**
 * Code Insertion Helpers
 *
 * Shared helpers for the "code to file" commands (copy/move selection or
 * function to another file).
 *
 * @category Commands
 * @module commands/codeInsertion
 */

import * as vscode from 'vscode';

import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { IFileDiscoveryService } from '../di/interfaces/IFileDiscoveryService';
import type { ILogger } from '../di/interfaces/ILogger';

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot >= 0 ? fileName.substring(lastDot) : '';
}

export function isSupportedFileType(fileName: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].includes(getFileExtension(fileName));
}

/**
 * Resolve the target file: auto-select a single compatible file, otherwise
 * prompt. Returns undefined when cancelled or when the target is not writable
 * (an error message is shown in the latter case).
 */
export async function resolveTargetFile(
  fileDiscoveryService: IFileDiscoveryService,
  sourceExtension: string,
): Promise<string | undefined> {
  const compatibleFiles = await fileDiscoveryService.getCompatibleFiles(sourceExtension);

  let targetFilePath: string | undefined;
  if (compatibleFiles.length === 1 && compatibleFiles[0]) {
    targetFilePath = compatibleFiles[0].path;
  } else {
    targetFilePath = await fileDiscoveryService.showFileSelector(compatibleFiles);
  }

  if (!targetFilePath) {
    return undefined; // User cancelled
  }

  const isValid = await fileDiscoveryService.validateTargetFile(targetFilePath);
  if (!isValid) {
    vscode.window.showErrorMessage('Target file is not accessible or writable');
    return undefined;
  }
  return targetFilePath;
}

export async function copyCodeToTargetFile(
  code: string,
  targetFilePath: string,
  configService: IConfigurationService,
  logger: ILogger,
): Promise<void> {
  try {
    const targetUri = vscode.Uri.file(targetFilePath);
    const targetDocument = await vscode.workspace.openTextDocument(targetUri);

    const insertionPoint = getInsertionPoint(targetDocument, configService);

    const targetEditor = await vscode.window.showTextDocument(
      targetDocument,
      vscode.ViewColumn.Beside,
    );

    const applied = await targetEditor.edit((editBuilder) => {
      editBuilder.insert(insertionPoint, `\n${code}\n`);
    });
    if (!applied) {
      throw new Error(`Failed to insert code into '${targetFilePath}'`);
    }
  } catch (error) {
    logger.error('Error copying code to target file', error);
    const isPermissionError =
      error instanceof Error &&
      (error.message.includes('EACCES') ||
        error.message.includes('EPERM') ||
        error.message.includes('permission'));
    if (isPermissionError) {
      throw new Error(
        `Permission denied writing to '${targetFilePath}'. Check that the file is not read-only and you have write access.`,
        { cause: error },
      );
    }
    throw error;
  }
}

export function getInsertionPoint(
  document: vscode.TextDocument,
  configService: IConfigurationService,
): vscode.Position {
  const config = configService.getCopyCodeConfig();

  switch (config.insertionPoint) {
    case 'beginning':
      return new vscode.Position(0, 0);
    case 'end':
      return new vscode.Position(document.lineCount, 0);
    default:
      // Smart insertion: after imports, before exports
      return findSmartInsertionPoint(document);
  }
}

export function findSmartInsertionPoint(document: vscode.TextDocument): vscode.Position {
  const lines = document.getText().split('\n');
  const atCodeStart = computeCodeLineStarts(lines);

  let lastImportEndLine = -1;
  let firstExportLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (!atCodeStart[i]) {
      continue;
    }
    const line = lines[i]?.trim() ?? '';

    if (/^import(\s|\{|['"])/.test(line)) {
      // Import statements may span lines; end at the line closing with a quoted specifier
      for (let j = i; j < lines.length; j++) {
        const text = lines[j]?.trim() ?? '';
        const code = text
          .replace(/\/\*.*?\*\//g, '')
          .replace(/\s\/\/.*$/, '')
          .trimEnd();
        if (/(['"]|\brequire\(\s*['"][^'"]*['"]\s*\))\s*;?$/.test(code)) {
          lastImportEndLine = j;
          i = j;
          break;
        }
      }
    } else if (line.startsWith('export ') && firstExportLine === -1) {
      firstExportLine = i;
    }
  }

  // Insert after imports, or before exports, or at end
  if (lastImportEndLine >= 0) {
    return new vscode.Position(lastImportEndLine + 1, 0);
  } else if (firstExportLine >= 0) {
    return new vscode.Position(firstExportLine, 0);
  } else {
    return new vscode.Position(document.lineCount, 0);
  }
}

/**
 * For each line, whether it starts in plain code (not inside a block comment
 * or template literal). Simple scanner; not a full tokenizer.
 */
export function computeCodeLineStarts(lines: string[]): boolean[] {
  const result: boolean[] = [];
  let inBlockComment = false;
  let inTemplate = false;

  for (const line of lines) {
    result.push(!inBlockComment && !inTemplate);
    let quote: string | null = null;

    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      const next = line[c + 1];
      if (inBlockComment) {
        if (ch === '*' && next === '/') {
          inBlockComment = false;
          c++;
        }
      } else if (inTemplate) {
        if (ch === '\\') {
          c++;
        } else if (ch === '`') {
          inTemplate = false;
        }
      } else if (quote) {
        if (ch === '\\') {
          c++;
        } else if (ch === quote) {
          quote = null;
        }
      } else if (ch === '/' && next === '/') {
        break;
      } else if (ch === '/' && next === '*') {
        inBlockComment = true;
        c++;
      } else if (ch === '`') {
        inTemplate = true;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      }
    }
  }
  return result;
}
