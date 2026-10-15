/**
 * Save All Command
 *
 * Saves all open text documents via the file save service.
 *
 * @category Commands
 * @subcategory File Operations
 */

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IFileSaveService } from '../di/interfaces/IFileSaveService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { CommandResult } from './BaseCommandHandler';
import { BaseCommandHandler } from './BaseCommandHandler';
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
    this.logInfo('Save All command triggered');

    try {
      const result = await this.fileSaveService.saveAllFiles();

      const message =
        result.savedCount > 0
          ? `Saved ${result.savedCount} file${result.savedCount === 1 ? '' : 's'}`
          : 'No unsaved files found';

      this.logInfo('Save All completed', result);
      return this.success(message);
    } catch (error) {
      this.logError('Error in Save All command', error);
      const errorMessage = `Failed to save files: ${error instanceof Error ? error.message : String(error)}`;
      this.showError(errorMessage);
      return this.error('Failed to save files', error);
    }
  }
}
