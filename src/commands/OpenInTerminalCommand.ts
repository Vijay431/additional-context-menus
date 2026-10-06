/**
 * Open in Terminal Command
 *
 * Opens a terminal at the appropriate directory for the current file.
 *
 * @category Commands
 * @subcategory Terminal Operations
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { ITerminalService } from '../di/interfaces/ITerminalService';

import { BaseCommandHandler } from './BaseCommandHandler';
import type { CommandResult } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

/**
 * Open in Terminal Command Handler
 */
export class OpenInTerminalCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly terminalService: ITerminalService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('OpenInTerminal', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Open in Terminal command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return this.error('No active editor found');
      }

      const filePath = editor.document.fileName;
      await this.terminalService.openInTerminal(filePath);
      return this.success('Terminal opened');
    } catch (error) {
      this.logger.error('Error in Open in Terminal command', error);
      vscode.window.showErrorMessage('Failed to open terminal');
      return this.error('Failed to open terminal', error);
    }
  }
}
