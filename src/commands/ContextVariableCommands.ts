/**
 * Context Variable Commands (debug / refresh)
 *
 * @category Commands
 * @subcategory Diagnostics
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { IProjectDetectionService } from '../di/interfaces/IProjectDetectionService';

import { BaseCommandHandler } from './BaseCommandHandler';
import type { CommandResult } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

/** Prints extension state to a debug output channel. */
export class DebugContextVariablesCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly projectDetectionService: IProjectDetectionService,
    private readonly configService: IConfigurationService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('DebugContextVariables', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.debug('Debug Context Variables command triggered');
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const projectType = await this.projectDetectionService.detectProjectType();
      const isEnabled = this.configService.isEnabled();

      const debugInfo = [
        'Extension State:',
        `  - Enabled: ${isEnabled}`,
        `  - Node Project: ${projectType.isNodeProject}`,
        `  - Workspace Folders: ${workspaceFolders?.length ?? 0}`,
        `  - Frameworks: ${projectType.frameworks.join(', ')}`,
        `  - TypeScript: ${projectType.hasTypeScript}`,
        `  - Support Level: ${projectType.supportLevel}`,
      ];

      const outputChannel = vscode.window.createOutputChannel('Additional Context Menus Debug');
      outputChannel.show();
      outputChannel.appendLine(debugInfo.join('\n'));

      this.logger.info('Debug context variables displayed');
      return this.success('Debug context variables displayed');
    } catch (error) {
      this.logger.error('Error debugging context variables', error);
      vscode.window.showErrorMessage('Failed to debug context variables');
      return this.error('Failed to debug context variables', error);
    }
  }
}

/** Recomputes the context variables used for menu visibility. */
export class RefreshContextVariablesCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly projectDetectionService: IProjectDetectionService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super('RefreshContextVariables', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.debug('Refresh Context Variables command triggered');
    try {
      await this.projectDetectionService.updateContextVariables();
      vscode.window.showInformationMessage('Context variables refreshed');
      this.logger.info('Context variables refreshed');
      return this.success('Context variables refreshed');
    } catch (error) {
      this.logger.error('Error refreshing context variables', error);
      vscode.window.showErrorMessage('Failed to refresh context variables');
      return this.error('Failed to refresh context variables', error);
    }
  }
}
