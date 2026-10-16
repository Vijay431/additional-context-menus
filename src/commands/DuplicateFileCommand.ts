/**
 * Duplicate File Command
 *
 * Duplicates a file next to the original as <name>-duplicate[-N]<ext>.
 *
 * @category Commands
 * @subcategory File Operations
 */

import * as path from 'node:path';

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { CommandResult } from './BaseCommandHandler';
import { BaseCommandHandler } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

const MAX_DUPLICATES = 100;

/**
 * True when a `workspace.fs.stat` failure means the path does not exist.
 * VS Code FileSystemError uses code 'FileNotFound'; providers, remote file
 * systems and Node-style errors may instead use 'ENOENT'.
 */
function isNotFoundError(error: unknown): boolean {
  if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
    return true;
  }
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'ENOENT' || code === 'FileNotFound';
}

/**
 * Duplicate File Command Handler
 */
export class DuplicateFileCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly uri: vscode.Uri | undefined,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('DuplicateFile', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Duplicate File command triggered');

    try {
      const targetUri = this.uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        const message =
          'No file selected. Right-click a file in the Explorer and choose Duplicate File.';
        this.showError(message);
        return this.error(message);
      }

      const stat = await vscode.workspace.fs.stat(targetUri);
      if (stat.type & vscode.FileType.Directory) {
        const message = 'Duplicate File only works on files, not folders.';
        this.showError(message);
        return this.error(message);
      }

      const ext = path.posix.extname(targetUri.path);
      const nameWithoutExt = path.posix.basename(targetUri.path, ext);

      const parentPosixPath = path.posix.dirname(targetUri.path);

      // Find a free name: <name>-duplicate<ext>, then <name>-duplicate-1<ext>, etc.
      let candidatePosixPath = path.posix.join(
        parentPosixPath,
        `${nameWithoutExt}-duplicate${ext}`,
      );
      let counter = 1;
      let slotFound = false;
      while (!slotFound) {
        if (counter > MAX_DUPLICATES) {
          const message = `Could not find a free name after ${MAX_DUPLICATES} attempts. Please rename or remove existing duplicates.`;
          this.showError(message);
          return this.error(message);
        }
        try {
          await vscode.workspace.fs.stat(targetUri.with({ path: candidatePosixPath }));
          // File exists — try next increment
          candidatePosixPath = path.posix.join(
            parentPosixPath,
            `${nameWithoutExt}-duplicate-${counter}${ext}`,
          );
          counter++;
        } catch (statError) {
          if (isNotFoundError(statError)) {
            slotFound = true;
          } else {
            throw statError; // propagate permission / network errors to outer catch
          }
        }
      }

      const newUri = targetUri.with({ path: candidatePosixPath });
      try {
        await vscode.workspace.fs.copy(targetUri, newUri, { overwrite: false });
      } catch (copyError) {
        // FileSystemError on a naming collision = TOCTOU race condition
        if (copyError instanceof vscode.FileSystemError && copyError.code === 'FileExists') {
          const message =
            'Could not create duplicate — a naming collision occurred. Please try again.';
          this.showWarning(message);
          return this.error(message, copyError);
        }
        throw copyError; // re-throw non-collision errors to outer catch
      }

      const originalName = path.posix.basename(targetUri.path);
      const newName = path.posix.basename(candidatePosixPath);
      const message = `Duplicated ${originalName} → ${newName}`;
      this.showInfo(message);
      this.logger.info(`File duplicated: ${targetUri.toString()} → ${newUri.toString()}`);
      return this.success(message);
    } catch (error) {
      this.logger.error('Error in Duplicate File command', error);
      this.showError(
        `Failed to duplicate file: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.error('Failed to duplicate file', error);
    }
  }
}
