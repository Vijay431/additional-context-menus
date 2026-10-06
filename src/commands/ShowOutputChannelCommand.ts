/**
 * Show Output Channel Command
 *
 * @category Commands
 * @subcategory Diagnostics
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';

import { BaseCommandHandler } from './BaseCommandHandler';
import type { CommandResult } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

/** Shows the extension output channel. */
export class ShowOutputChannelCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(logger: ILogger, accessibilityService: IAccessibilityService) {
    super('ShowOutputChannel', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.debug('Show Output Channel command triggered');
    try {
      const outputChannel = vscode.window.createOutputChannel('Additional Context Menus');
      outputChannel.show(true);
      outputChannel.appendLine('Extension output channel opened');
      this.logger.info('Output channel shown');
      return this.success('Output channel shown');
    } catch (error) {
      this.logger.error('Error showing output channel', error);
      vscode.window.showErrorMessage('Failed to show output channel');
      return this.error('Failed to show output channel', error);
    }
  }
}
