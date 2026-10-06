/**
 * Copy File Contents Command
 *
 * Copies the full text of a file to the clipboard (10 MB cap).
 *
 * @category Commands
 * @subcategory File Operations
 */

import * as path from 'path';

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';

import { BaseCommandHandler } from './BaseCommandHandler';
import type { CommandResult } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Copy File Contents Command Handler
 */
export class CopyFileContentsCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly uri: vscode.Uri | undefined,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('CopyFileContents', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Copy File Contents command triggered');

    try {
      const targetUri = this.uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        const message =
          'No file selected. Right-click a file in the Explorer and choose Copy File Contents.';
        this.showError(message);
        return this.error(message);
      }

      const stat = await vscode.workspace.fs.stat(targetUri);
      if (stat.type & vscode.FileType.Directory) {
        const message = 'Copy File Contents only works on files, not folders.';
        this.showError(message);
        return this.error(message);
      }
      if (stat.size > MAX_BYTES) {
        const message = `File is too large to copy (${(stat.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`;
        this.showWarning(message);
        return this.error(message);
      }
      const bytes = await vscode.workspace.fs.readFile(targetUri);
      const contents = new TextDecoder('utf-8').decode(bytes);
      await vscode.env.clipboard.writeText(contents);

      const fileName = path.basename(targetUri.fsPath);
      const message = `Copied contents of ${fileName} to clipboard`;
      this.showInfo(message);
      this.logger.info(`File contents copied: ${targetUri.fsPath}`);
      return this.success(message);
    } catch (error) {
      this.logger.error('Error in Copy File Contents command', error);
      this.showError(
        `Failed to copy file contents: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.error('Failed to copy file contents', error);
    }
  }
}
