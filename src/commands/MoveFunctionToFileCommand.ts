/**
 * Move Function To File Command
 *
 * Moves the function at the cursor to another file.
 *
 * @category Commands
 * @subcategory File Operations
 */

import * as path from 'node:path';

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ICodeAnalysisService } from '../di/interfaces/ICodeAnalysisService';
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

export class MoveFunctionToFileCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly codeAnalysisService: ICodeAnalysisService,
    private readonly fileDiscoveryService: IFileDiscoveryService,
    private readonly configService: IConfigurationService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('MoveFunctionToFile', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Move Function to File command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        this.showError('No active editor found');
        return this.error('No active editor found');
      }

      if (!isSupportedFileType(editor.document.fileName)) {
        const message = 'Move Function to File only supports .ts, .tsx, .js, .jsx files.';
        this.showWarning(message);
        return this.error(message);
      }

      const document = editor.document;
      const position = editor.selection.active;

      const functionInfo = await this.codeAnalysisService.findFunctionAtPosition(
        document,
        position,
      );

      if (!functionInfo) {
        const message =
          'No function found at cursor position. Place the cursor inside a function, arrow function, method, or class declaration and try again.';
        this.showWarning(message);
        return this.error(message);
      }

      const sourceExtension = getFileExtension(document.fileName);
      const targetFilePath = await resolveTargetFile(this.fileDiscoveryService, sourceExtension);
      if (!targetFilePath) {
        return this.error('No target file');
      }

      // Inserting into the source file shifts the function's line range, so the delete below
      // would remove the wrong lines.
      if (path.resolve(targetFilePath) === path.resolve(document.uri.fsPath)) {
        const message = 'Move Function to File needs a different target file than the source file.';
        this.showWarning(message);
        return this.error(message);
      }

      await copyCodeToTargetFile(
        functionInfo.fullText,
        targetFilePath,
        this.configService,
        this.logger,
      );

      const range = new vscode.Range(
        new vscode.Position(functionInfo.startLine - 1, 0),
        new vscode.Position(functionInfo.endLine - 1, Number.MAX_SAFE_INTEGER),
      );

      const removed = await editor.edit((editBuilder) => {
        editBuilder.delete(range);
      });
      if (!removed) {
        const message = `Function '${functionInfo.name}' was copied to ${path.basename(targetFilePath)} but could not be removed from the source file.`;
        this.showError(message);
        return this.error(message);
      }

      const fileName = path.basename(targetFilePath);
      const message = `Function '${functionInfo.name}' moved to ${fileName}`;
      this.showInfo(message);
      this.logger.info(`Function moved: ${functionInfo.name} to ${targetFilePath}`);
      return this.success(message);
    } catch (error) {
      this.logger.error('Error in Move Function to File command', error);
      const msg =
        error instanceof Error
          ? error.message
          : `Failed to move function to file. Check file permissions and try again.`;
      this.showError(msg);
      return this.error(msg, error);
    }
  }
}
