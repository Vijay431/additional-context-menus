/**
 * Enable / Disable Commands
 *
 * Toggle the extension's `enabled` configuration value.
 *
 * @category Commands
 * @subcategory Configuration
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { CommandResult } from './BaseCommandHandler';
import { BaseCommandHandler } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

/** Enables the extension. */
export class EnableCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly configService: IConfigurationService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('Enable', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    await this.configService.updateConfiguration('enabled', true);
    vscode.window.showInformationMessage('Additional Context Menus enabled');
    return this.success('Additional Context Menus enabled');
  }
}

/** Disables the extension. */
export class DisableCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly configService: IConfigurationService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('Disable', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    await this.configService.updateConfiguration('enabled', false);
    vscode.window.showInformationMessage(
      'Additional Context Menus disabled. To re-enable, run "Additional Context Menus: Enable" from the Command Palette.',
    );
    return this.success('Additional Context Menus disabled');
  }
}
