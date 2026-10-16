/**
 * Copy Lines To File Command
 *
 * Copies the selected code to another file.
 *
 * @category Commands
 * @subcategory File Operations
 */

import * as path from 'node:path';

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { IFileDiscoveryService } from '../di/interfaces/IFileDiscoveryService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { CommandResult } from './BaseCommandHandler';
import { BaseCommandHandler } from './BaseCommandHandler';
import {
  copyCodeToTargetFile,
  getFileExtension,
  isSupportedFileType,
  resolveTargetFile,
} from './codeInsertion';
import type { ICommandHandler } from './ICommandHandler';

export class CopyLinesToFileCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly fileDiscoveryService: IFileDiscoveryService,
    private readonly configService: IConfigurationService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('CopyLinesToFile', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Copy Lines to File command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        this.showError('No active editor found');
        return this.error('No active editor found');
      }

      if (!isSupportedFileType(editor.document.fileName)) {
        const message = 'Copy Selection to File only supports .ts, .tsx, .js, .jsx files.';
        this.showWarning(message);
        return this.error(message);
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        this.showWarning('No code selected');
        return this.error('No code selected');
      }

      const selectedText = editor.document.getText(selection);
      const sourceExtension = getFileExtension(editor.document.fileName);

      const targetFilePath = await resolveTargetFile(this.fileDiscoveryService, sourceExtension);
      if (!targetFilePath) {
        return this.error('No target file');
      }

      await copyCodeToTargetFile(selectedText, targetFilePath, this.configService, this.logger);

      const fileName = path.basename(targetFilePath);
      const message = `Lines copied to ${fileName}`;
      this.showInfo(message);
      this.logger.info(`Lines copied to: ${targetFilePath}`);
      return this.success(message);
    } catch (error) {
      this.logger.error('Error in Copy Lines to File command', error);
      const msg =
        error instanceof Error
          ? error.message
          : `Failed to copy lines to file. Check file permissions and try again.`;
      this.showError(msg);
      return this.error(msg, error);
    }
  }
}
