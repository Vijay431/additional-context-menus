import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type {
  IFileSaveService,
  FileSaveResult as IFileSaveResult,
} from '../di/interfaces/IFileSaveService';
import type { ILogger } from '../di/interfaces/ILogger';
import { AccessibilityService } from '../services/accessibilityService';
import { Logger } from '../utils/logger';

import { ConfigurationService } from './configurationService';

/** Minimum dirty-file count that triggers the progress notification */
const PROGRESS_THRESHOLD = 5;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * File Save Service
 *
 * Enhanced file save operations with progress feedback, read-only handling,
 * and configurable notifications.
 *
 * @description
 * This service provides improved save functionality for VS Code workspaces.
 * Handles multiple files simultaneously with progress feedback and error reporting.
 *
 * Key Features:
 * - Save all dirty documents with progress tracking
 * - Visual progress notification for large operations (>= 5 files)
 * - Read-only file handling (configurable skip)
 * - Configurable success/failure notifications
 * - Detailed error reporting with failure counts
 * - Support for workspace multi-root scenarios
 *
 * @example
 * ```typescript
 * // Using DI (recommended)
 * constructor(@inject(TYPES.FileSaveService) private saveService: IFileSaveService) {}
 *
 * // Using singleton (legacy)
 * const saveService = FileSaveService.getInstance();
 * ```
 *
 * @see ConfigurationService - Provides saveAll configuration
 * @see ContextMenuManager - Uses this service for save operations
 *
 * @category File Operations
 * @subcategory File Management
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.0.0
 */
export class FileSaveService implements IFileSaveService {
  private static instance: FileSaveService | undefined;
  private logger: ILogger;
  private configService: IConfigurationService;
  private accessibilityService: IAccessibilityService;

  private constructor(
    logger: ILogger,
    configService: IConfigurationService,
    accessibilityService: IAccessibilityService,
  ) {
    this.logger = logger;
    this.configService = configService;
    this.accessibilityService = accessibilityService;
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): FileSaveService {
    FileSaveService.instance ??= new FileSaveService(
      Logger.getInstance(),
      ConfigurationService.getInstance(),
      AccessibilityService.getInstance(),
    );
    return FileSaveService.instance;
  }

  /**
   * Create a new FileSaveService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @param configService - The configuration service instance
   * @param accessibilityService - The accessibility service instance
   * @returns A new FileSaveService instance
   */
  public static create(
    logger: ILogger,
    configService: IConfigurationService,
    accessibilityService: IAccessibilityService,
  ): FileSaveService {
    return new FileSaveService(logger, configService, accessibilityService);
  }

  public async saveAllFiles(): Promise<IFileSaveResult> {
    this.logger.info('Save All operation started');

    try {
      const { documents, skippedFiles } = await this.getUnsavedFiles();

      if (documents.length === 0) {
        const message = 'No unsaved files found';
        this.logger.info(message);

        await this.accessibilityService.announce(message, 'normal');

        if (this.configService.getSaveAllConfig().showNotification) {
          vscode.window.showInformationMessage(message);
        }

        return this.buildResult([], [...skippedFiles], []);
      }

      const result =
        documents.length >= PROGRESS_THRESHOLD
          ? await this.saveWithProgress(documents, skippedFiles)
          : await this.saveDocuments(documents, skippedFiles);

      this.showCompletionNotification(result);
      this.logger.info('Save All operation completed', result);

      return result;
    } catch (error) {
      this.logger.error('Save All operation failed', error);
      throw error;
    }
  }

  private buildResult(
    savedFiles: string[],
    skippedFiles: string[],
    failedFiles: { path: string; error: string }[],
  ): IFileSaveResult {
    return {
      savedCount: savedFiles.length,
      skippedCount: skippedFiles.length,
      failedCount: failedFiles.length,
      savedFiles,
      skippedFiles,
      failedFiles,
    };
  }

  private async isReadOnly(uri: vscode.Uri): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      return ((stat.permissions ?? 0) & vscode.FilePermission.Readonly) !== 0;
    } catch {
      // Cannot determine; let the save attempt report any real failure
      return false;
    }
  }

  private async getUnsavedFiles(): Promise<{
    documents: vscode.TextDocument[];
    skippedFiles: string[];
  }> {
    const documents: vscode.TextDocument[] = [];
    const skippedFiles: string[] = [];
    const skipReadOnly = this.configService.getSaveAllConfig().skipReadOnly;

    for (const document of vscode.workspace.textDocuments) {
      if (!document.isDirty || document.isUntitled) {
        continue;
      }
      if (skipReadOnly && (await this.isReadOnly(document.uri))) {
        this.logger.warn(`Skipping read-only file: ${document.fileName}`);
        skippedFiles.push(document.fileName);
        continue;
      }
      documents.push(document);
    }

    return { documents, skippedFiles };
  }

  private async saveFileInternal(document: vscode.TextDocument): Promise<boolean> {
    try {
      // Use VS Code's save API
      const success = await document.save();
      return success;
    } catch (error) {
      this.logger.error(`Error saving file ${document.fileName}`, error);
      throw error;
    }
  }

  /**
   * Save one document, recording the outcome into the supplied accumulators.
   */
  private async saveDocumentInto(
    document: vscode.TextDocument,
    savedFiles: string[],
    skippedFiles: string[],
    failedFiles: { path: string; error: string }[],
  ): Promise<void> {
    try {
      if (await this.saveFileInternal(document)) {
        savedFiles.push(document.fileName);
        this.logger.debug(`Saved file: ${document.fileName}`);
      } else {
        skippedFiles.push(document.fileName);
        this.logger.warn(`Skipped file: ${document.fileName}`);
      }
    } catch (error) {
      failedFiles.push({ path: document.fileName, error: errorMessage(error) });
      this.logger.error(`Failed to save file: ${document.fileName}`, error);
    }
  }

  private async saveDocuments(
    documents: vscode.TextDocument[],
    preSkipped: string[] = [],
  ): Promise<IFileSaveResult> {
    const savedFiles: string[] = [];
    const skippedFiles = [...preSkipped];
    const failedFiles: { path: string; error: string }[] = [];

    // Save sequentially for better error handling
    for (const document of documents) {
      await this.saveDocumentInto(document, savedFiles, skippedFiles, failedFiles);
    }

    return this.buildResult(savedFiles, skippedFiles, failedFiles);
  }

  private async saveWithProgress(
    files: vscode.TextDocument[],
    preSkipped: string[] = [],
  ): Promise<IFileSaveResult> {
    const savedFiles: string[] = [];
    const skippedFiles = [...preSkipped];
    const failedFiles: { path: string; error: string }[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Saving all files...',
        cancellable: false,
      },
      async (progress) => {
        const increment = 100 / files.length;

        for (let i = 0; i < files.length; i++) {
          const document = files.at(i);

          if (!document) {
            continue;
          }

          progress.report({
            message: `Saving ${document.fileName} (${i + 1} of ${files.length})`,
          });

          // Announce progress for verbose mode
          void this.accessibilityService.announceProgress('Saving files', i + 1, files.length);

          await this.saveDocumentInto(document, savedFiles, skippedFiles, failedFiles);

          progress.report({ increment });
        }
      },
    );

    return this.buildResult(savedFiles, skippedFiles, failedFiles);
  }

  private showCompletionNotification(result: IFileSaveResult): void {
    const config = this.configService.getSaveAllConfig();

    if (!config.showNotification) {
      return;
    }

    if (result.failedCount === 0) {
      if (result.savedCount > 0) {
        const message = `Saved ${result.savedCount} file${result.savedCount === 1 ? '' : 's'}`;
        vscode.window.showInformationMessage(message);
        void this.accessibilityService.announceSuccess(
          'Save All',
          `Saved ${result.savedCount} files`,
        );
      }
    } else {
      const total = result.savedCount + result.skippedCount + result.failedCount;
      const message = `Saved ${result.savedCount}/${total} files. ${result.failedCount} failed.`;
      void this.accessibilityService.announceError(
        'Save All',
        `${result.failedCount} files failed to save`,
      );
      Promise.resolve(vscode.window.showWarningMessage(message, 'Show Details'))
        .then(
          (selection) => {
            if (selection === 'Show Details') {
              this.showFailureDetails(result);
            }
            return selection;
          },
          (error: unknown) => {
            this.logger.error('Error showing warning message', error);
          },
        )
        .catch((error: unknown) => {
          this.logger.error('Unexpected error in warning message handling', error);
        });
    }
  }

  private showFailureDetails(result: IFileSaveResult): void {
    const total = result.savedCount + result.skippedCount + result.failedCount;
    const details = [
      'Save All Results:',
      `- Total files: ${total}`,
      `- Saved successfully: ${result.savedCount}`,
      `- Failed: ${result.failedCount}`,
      `- Skipped: ${result.skippedCount}`,
      '',
    ];

    if (result.failedFiles.length > 0) {
      details.push('Failed files:');
      result.failedFiles.forEach((file) => details.push(`- ${file.path}: ${file.error}`));
      details.push('');
    }

    if (result.skippedFiles.length > 0) {
      details.push('Skipped files:');
      result.skippedFiles.forEach((file) => details.push(`- ${file}`));
    }

    this.logger.info(details.join('\n'));
    this.logger.show();
  }

  public hasUnsavedChanges(): boolean {
    return vscode.workspace.textDocuments.some((doc) => doc.isDirty && !doc.isUntitled);
  }

  public getUnsavedFileCount(): number {
    return vscode.workspace.textDocuments.filter((doc) => doc.isDirty && !doc.isUntitled).length;
  }

  /**
   * Save a document by URI.
   *
   * @returns 'saved' if saved, 'skipped' if not open, not dirty, or VS Code declined to save
   */
  private async saveFileStatus(uri: { toString(): string }): Promise<'saved' | 'skipped'> {
    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uri.toString(),
    );
    if (!document?.isDirty) {
      return 'skipped';
    }
    return (await document.save()) ? 'saved' : 'skipped';
  }

  public async saveFile(uri: { toString(): string }): Promise<void> {
    await this.saveFileStatus(uri);
  }

  public async saveFiles(uris: { toString(): string }[]): Promise<IFileSaveResult> {
    const savedFiles: string[] = [];
    const skippedFiles: string[] = [];
    const failedFiles: { path: string; error: string }[] = [];

    for (const uri of uris) {
      const path = uri.toString();
      try {
        if ((await this.saveFileStatus(uri)) === 'saved') {
          savedFiles.push(path);
        } else {
          skippedFiles.push(path);
        }
      } catch (error) {
        failedFiles.push({ path, error: errorMessage(error) });
      }
    }

    return this.buildResult(savedFiles, skippedFiles, failedFiles);
  }
}
