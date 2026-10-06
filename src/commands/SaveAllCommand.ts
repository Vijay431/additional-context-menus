/**
 * Save All Command
 *
 * Saves all open text documents via the file save service.
 *
 * @category Commands
 * @subcategory File Operations
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IFileSaveService } from '../di/interfaces/IFileSaveService';
import type { ILogger } from '../di/interfaces/ILogger';

import { BaseCommandHandler } from './BaseCommandHandler';
import type { CommandResult } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

/**
 * Save All Command Handler
 */
export class SaveAllCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly fileSaveService: IFileSaveService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('SaveAll', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Save All command triggered');

    try {
      const result = await this.fileSaveService.saveAllFiles();
      this.logger.info('Save All completed', result);
      return this.success('Save All completed');
    } catch (error) {
      this.logger.error('Error in Save All command', error);
      vscode.window.showErrorMessage(`Failed to save files: ${(error as Error).message}`);
      return this.error('Failed to save files', error);
    }
  }
}
