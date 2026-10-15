/**
 * Open in Terminal Command
 *
 * Opens a terminal at the appropriate directory for the current file.
 *
 * @category Commands
 * @subcategory Terminal Operations
 */

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { ITerminalService } from '../di/interfaces/ITerminalService';
import type { CommandResult } from './BaseCommandHandler';
import { BaseCommandHandler } from './BaseCommandHandler';
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
    this.logInfo('Open in Terminal command triggered');

    try {
      const editor = this.requireActiveEditor();
      const filePath = editor.document.fileName;

      await this.terminalService.openInTerminal(filePath);

      const fileName = this.getFileName(filePath);
      const message = `Terminal opened in ${fileName}`;
      this.showInfo(message);
      this.logInfo(`Terminal opened for: ${filePath}`);
      return this.success(message);
    } catch (error) {
      this.logError('Error in Open in Terminal command', error);
      this.showError('Failed to open terminal');
      return this.error('Failed to open terminal', error);
    }
  }

  private getFileName(filePath: string): string {
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    return lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
  }
}
