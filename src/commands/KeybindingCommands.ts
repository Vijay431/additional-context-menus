/**
 * Keybinding Commands (check / enable / disable)
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

/** Shows the current keybinding configuration. */
export class CheckKeybindingConflictsCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly configService: IConfigurationService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('CheckKeybindingConflicts', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.debug('Check Keybinding Conflicts command triggered');
    try {
      const config = this.configService.getConfiguration();
      const enabled = config.keybindings.enabled;
      const showInMenu = config.keybindings.showInMenu;

      let message = 'Keybinding Configuration:\n';
      message += `  - Enabled: ${enabled}\n`;
      message += `  - Show in Menu: ${showInMenu}\n`;

      if (!enabled) {
        message += '\nCustom keybindings are currently disabled.';
      } else {
        message += '\nCustom keybindings are enabled.';
      }

      await vscode.window.showInformationMessage(message, 'OK');
      this.logger.info('Keybinding conflicts checked');
      return this.success('Keybinding conflicts checked');
    } catch (error) {
      this.logger.error('Error checking keybinding conflicts', error);
      vscode.window.showErrorMessage('Failed to check keybinding conflicts');
      return this.error('Failed to check keybinding conflicts', error);
    }
  }
}

/** Enables custom keybindings after confirmation. */
export class EnableKeybindingsCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(logger: ILogger, accessibilityService: IAccessibilityService) {
    super('EnableKeybindings', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.debug('Enable Keybindings command triggered');
    try {
      const confirm = await vscode.window.showWarningMessage(
        'Enable custom keybindings for extension commands?',
        'Enable',
        'Cancel',
      );

      if (confirm === 'Enable') {
        await vscode.workspace
          .getConfiguration('additionalContextMenus')
          .update('enableKeybindings', true, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Custom keybindings enabled');
        this.logger.info('Custom keybindings enabled');
        return this.success('Custom keybindings enabled');
      }
      return this.success('Cancelled');
    } catch (error) {
      this.logger.error('Error enabling keybindings', error);
      vscode.window.showErrorMessage('Failed to enable keybindings');
      return this.error('Failed to enable keybindings', error);
    }
  }
}

/** Disables custom keybindings. */
export class DisableKeybindingsCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(logger: ILogger, accessibilityService: IAccessibilityService) {
    super('DisableKeybindings', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.debug('Disable Keybindings command triggered');
    try {
      await vscode.workspace
        .getConfiguration('additionalContextMenus')
        .update('enableKeybindings', false, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Custom keybindings disabled');
      this.logger.info('Custom keybindings disabled');
      return this.success('Custom keybindings disabled');
    } catch (error) {
      this.logger.error('Error disabling keybindings', error);
      vscode.window.showErrorMessage('Failed to disable keybindings');
      return this.error('Failed to disable keybindings', error);
    }
  }
}
