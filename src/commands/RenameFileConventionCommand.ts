/**
 * Rename File Convention Command
 *
 * Renames a file or every file in a folder to a chosen naming convention.
 *
 * @category Commands
 * @subcategory File Operations
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IFileNamingConventionService } from '../di/interfaces/IFileNamingConventionService';
import type { ILogger } from '../di/interfaces/ILogger';
import { getAccessibleQuickPickItem } from '../utils/accessibilityHelper';
import type { CommandResult } from './BaseCommandHandler';
import { BaseCommandHandler } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

/**
 * Rename File Convention Command Handler
 */
export class RenameFileConventionCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly uri: vscode.Uri | undefined,
    private readonly fileNamingConventionService: IFileNamingConventionService,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
    private readonly isAccessibilityEnabled: () => boolean = () => true,
  ) {
    super('RenameFileConvention', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logger.info('Rename File Convention command triggered');

    try {
      const targetPath = this.uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath;

      if (!targetPath) {
        const message =
          'No file or folder selected. Select a file or folder in the Explorer and try again.';
        this.showError(message);
        return this.error(message);
      }

      const conventions = [
        getAccessibleQuickPickItem(
          {
            label: 'kebab-case',
            description: 'my-component-name.ts',
            value: 'kebab-case' as const,
          },
          { ariaLabel: 'Kebab case: my-component-name.ts' },
        ),
        getAccessibleQuickPickItem(
          { label: 'camelCase', description: 'myComponentName.ts', value: 'camelCase' as const },
          { ariaLabel: 'Camel case: myComponentName.ts' },
        ),
        getAccessibleQuickPickItem(
          { label: 'PascalCase', description: 'MyComponentName.ts', value: 'PascalCase' as const },
          { ariaLabel: 'Pascal case: MyComponentName.ts' },
        ),
      ];

      const selected = await vscode.window.showQuickPick(conventions, {
        placeHolder: 'Select naming convention',
      });

      if (!selected) {
        return this.success('Cancelled');
      }

      const convention = (
        selected as vscode.QuickPickItem & { value: 'kebab-case' | 'camelCase' | 'PascalCase' }
      ).value;

      const result = await this.fileNamingConventionService.renameByPath(targetPath, convention);

      if (result.totalFiles === 0) {
        this.showInfo('No files found to rename.');
        return this.success('No files found to rename.');
      }

      const parts: string[] = [];
      if (result.renamedFiles.length > 0) parts.push(`${result.renamedFiles.length} renamed`);
      if (result.skippedFiles > 0)
        parts.push(`${result.skippedFiles} already follow ${convention}`);
      if (result.failedFiles.length > 0) parts.push(`${result.failedFiles.length} failed`);
      const summary = parts.join(', ');

      if (result.failedFiles.length > 0) {
        this.showWarning(`Rename complete: ${summary}. Check Output Channel for details.`);
        for (const f of result.failedFiles) {
          this.logger.error(`Failed to rename: ${f.path} — ${f.error}`);
        }
      } else {
        this.showInfo(`Rename complete: ${summary}.`);
      }

      if (this.isAccessibilityEnabled()) {
        await this.announce(`Rename complete: ${summary}`, 'normal');
      }
      return this.success(`Rename complete: ${summary}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error in rename file convention', error);
      this.showError(`Failed to rename files: ${message}`);
      try {
        if (this.isAccessibilityEnabled()) {
          await this.announceError('Rename File Convention', message);
        }
      } catch {
        // announcements must never mask the original failure
      }
      return this.error('Failed to rename files', error);
    }
  }
}
