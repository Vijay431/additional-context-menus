/**
 * Copy Function Command
 *
 * Copies the function at the current cursor position to the clipboard.
 *
 * @category Commands
 * @subcategory Code Operations
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ICodeAnalysisService } from '../di/interfaces/ICodeAnalysisService';
import type { ILogger } from '../di/interfaces/ILogger';

import { BaseCommandHandler } from './BaseCommandHandler';
import type { CommandResult } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Copy Function Command Handler
 *
 * Screen reader announcements are only made when `isAccessibilityEnabled`
 * returns true (defaults to always enabled).
 */
export class CopyFunctionCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly codeAnalysisService: ICodeAnalysisService,
    accessibilityService: IAccessibilityService,
    logger: ILogger,
    private readonly isAccessibilityEnabled: () => boolean = () => true,
  ) {
    super('CopyFunction', logger, accessibilityService);
  }

  protected override async announce(
    message: string,
    verbosity: 'minimal' | 'normal' | 'verbose' = 'normal',
  ): Promise<void> {
    if (this.isAccessibilityEnabled()) {
      await super.announce(message, verbosity);
    }
  }

  protected override async announceSuccess(operation: string, detail?: string): Promise<void> {
    if (this.isAccessibilityEnabled()) {
      await super.announceSuccess(operation, detail);
    }
  }

  protected override async announceError(operation: string, error: string): Promise<void> {
    if (this.isAccessibilityEnabled()) {
      await super.announceError(operation, error);
    }
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Copy Function command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        await this.announceError('Copy Function', 'No active editor found');
        return this.error('No active editor found');
      }

      const fileName = editor.document.fileName;
      const lastDot = fileName.lastIndexOf('.');
      const extension = lastDot >= 0 ? fileName.substring(lastDot) : '';
      if (!SUPPORTED_EXTENSIONS.includes(extension)) {
        vscode.window.showWarningMessage('Copy Function only supports .ts, .tsx, .js, .jsx files.');
        return this.error('Unsupported file type');
      }

      const functionInfo = await this.codeAnalysisService.findFunctionAtPosition(
        editor.document,
        editor.selection.active,
      );

      if (!functionInfo) {
        const msg =
          'No function found at cursor position. Place the cursor inside a function, arrow function, method, or class declaration and try again.';
        vscode.window.showWarningMessage(msg);
        await this.announce(msg, 'minimal');
        return this.success(msg);
      }

      await vscode.env.clipboard.writeText(functionInfo.fullText);

      const message = `Copied ${functionInfo.type} '${functionInfo.name}' to clipboard`;
      vscode.window.showInformationMessage(message);
      await this.announceSuccess(
        'Copy Function',
        `Function '${functionInfo.name}' copied to clipboard`,
      );
      this.logger.info(`Function copied: ${functionInfo.name}`);
      return this.success(message);
    } catch (error) {
      this.logger.error('Error in Copy Function command', error);
      vscode.window.showErrorMessage('Failed to copy function');
      await this.announceError('Copy Function', 'Failed to copy function');
      return this.error('Failed to copy function', error);
    }
  }
}
