import { constants } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { IFileDiscoveryService, DiscoveredFile } from '../di/interfaces/IFileDiscoveryService';
import type { ILogger } from '../di/interfaces/ILogger';
import { AccessibilityService } from '../services/accessibilityService';
import { CompatibleFile } from '../types/extension';
import {
  createAccessibleFileDescription,
  formatAccessiblePlaceholder,
  getAccessibleQuickPickItem,
} from '../utils/accessibilityHelper';
import { Cache } from '../utils/cache';
import { Logger } from '../utils/logger';
import { isPathWithin, isSafeFilePath } from '../utils/pathValidator';

type FileQuickPickItem = vscode.QuickPickItem & { filePath: string };

/**
 * File Discovery Service
 *
 * Discovers and filters files in the workspace for code operations.
 * Provides caching for performance and handles file system changes.
 *
 * @description
 * This service scans the workspace for compatible files based on file extensions,
 * filters them appropriately, and provides a convenient interface for file selection.
 * Uses VS Code's file search API for optimal performance.
 *
 * Key Features:
 * - Workspace file scanning with pattern matching
 * - File extension compatibility rules (.ts ↔ .tsx, .js ↔ .jsx)
 * - Last-modified sorting for easy file selection
 * - Result caching for improved performance
 * - File system change monitoring (create, delete, rename)
 * - File accessibility validation
 * - QuickPick integration for user-friendly file selection
 *
 * Compatibility Rules:
 * - TypeScript (.ts/.tsx) ↔ TypeScript (.ts/.tsx)
 * - JavaScript (.js/.jsx) ↔ JavaScript (.js/.jsx)
 * - Cross-compatibility between TS and JS (limited)
 *
 * @example
 * ```typescript
 * // Using DI (recommended)
 * constructor(@inject(TYPES.FileDiscoveryService) private discovery: IFileDiscoveryService) {}
 *
 * // Using singleton (legacy)
 * const discoveryService = FileDiscoveryService.getInstance();
 * ```
 *
 * @see CodeAnalysisService - Used together for file operations
 * @see ContextMenuManager - Uses this service for file selection
 *
 * @category File Operations
 * @subcategory File Discovery
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.0.0
 */
export class FileDiscoveryService implements IFileDiscoveryService {
  private static instance: FileDiscoveryService | undefined = undefined;
  private logger: ILogger;
  private accessibilityService: IAccessibilityService;
  private fileCache: Cache<CompatibleFile[]>;

  private constructor(
    logger: ILogger,
    accessibilityService: IAccessibilityService,
    private configService?: IConfigurationService,
    _projectDetectionService?: unknown,
    cacheTTL: number = 5 * 60 * 1000,
  ) {
    this.logger = logger;
    this.accessibilityService = accessibilityService;
    this.fileCache = new Cache<CompatibleFile[]>({
      maxSize: 100,
      defaultTTL: cacheTTL,
      trackStats: false,
    });
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): FileDiscoveryService {
    FileDiscoveryService.instance ??= new FileDiscoveryService(
      Logger.getInstance(),
      AccessibilityService.getInstance(),
    );
    return FileDiscoveryService.instance;
  }

  /**
   * Create a new FileDiscoveryService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @param accessibilityService - The accessibility service instance
   * @param configService - Optional configuration service
   * @param projectDetectionService - Optional project detection service
   * @returns A new FileDiscoveryService instance
   */
  public static create(
    logger: ILogger,
    accessibilityService: IAccessibilityService,
    configService?: IConfigurationService,
    projectDetectionService?: unknown,
    cacheTTL?: number,
  ): FileDiscoveryService {
    return new FileDiscoveryService(
      logger,
      accessibilityService,
      configService,
      projectDetectionService,
      cacheTTL,
    );
  }

  public async getCompatibleFiles(sourceExtension: string): Promise<DiscoveredFile[]> {
    const compatibleFiles = await this.getCompatibleFilesOld(sourceExtension);
    return compatibleFiles.map((f) => ({
      path: f.path,
      name: f.name,
      extension: f.extension,
      relativePath: f.relativePath,
      languageId: this.getLanguageId(f.extension),
    }));
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getCompatibleFiles instead
   */
  private async getCompatibleFilesOld(sourceExtension: string): Promise<CompatibleFile[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return [];
    }

    const cacheKey = `${workspaceFolder.uri.fsPath}:${sourceExtension}`;
    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey)!;
    }

    try {
      const compatibleFiles = await this.scanWorkspaceForCompatibleFiles(
        workspaceFolder,
        sourceExtension,
      );
      this.fileCache.set(cacheKey, compatibleFiles);

      this.logger.debug(
        `Found ${compatibleFiles.length} compatible files for extension ${sourceExtension}`,
      );
      return compatibleFiles;
    } catch (error) {
      this.logger.error('Error scanning workspace for compatible files', error);
      return [];
    }
  }

  private async scanWorkspaceForCompatibleFiles(
    workspaceFolder: vscode.WorkspaceFolder,
    sourceExtension: string,
  ): Promise<CompatibleFile[]> {
    const compatibleFiles: CompatibleFile[] = [];
    const workspacePath = workspaceFolder.uri.fsPath;

    // Use VS Code's file search API for better performance
    const filePattern = this.getSearchPattern(sourceExtension);
    const files = await vscode.workspace.findFiles(filePattern, '**/node_modules/**');

    for (const fileUri of files) {
      try {
        const filePath = path.resolve(fileUri.fsPath);
        if (!isPathWithin(workspacePath, filePath) || !isSafeFilePath(filePath)) {
          continue;
        }
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated by isSafeFilePath()
        const stats = await fs.stat(filePath);
        const extension = path.extname(filePath);

        if (this.isCompatibleExtension(sourceExtension, extension)) {
          const relativePath = path.relative(workspacePath, filePath);
          const fileName = path.basename(filePath);

          compatibleFiles.push({
            path: filePath,
            name: fileName,
            extension,
            isCompatible: true,
            lastModified: stats.mtime,
            relativePath,
          });
        }
      } catch (error) {
        this.logger.warn(`Error processing file ${fileUri.fsPath}`, error);
      }
    }

    // Sort by last modified (most recent first)
    compatibleFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    return compatibleFiles;
  }

  private getSearchPattern(sourceExtension: string): string {
    switch (sourceExtension) {
      case '.ts':
        return '**/*.{ts,tsx}';
      case '.tsx':
        return '**/*.{ts,tsx}';
      case '.js':
        return '**/*.{js,jsx}';
      case '.jsx':
        return '**/*.{js,jsx}';
      default:
        return `**/*${sourceExtension}`;
    }
  }

  public isCompatibleExtension(source: string, target: string): boolean {
    // Normalize extensions (remove leading dot if present)
    const sourceExt = source.startsWith('.') ? source : `.${source}`;
    const targetExt = target.startsWith('.') ? target : `.${target}`;

    // Define compatibility rules
    const compatibilityRules: Record<string, string[]> = {
      '.ts': ['.ts', '.tsx'],
      '.tsx': ['.ts', '.tsx'],
      '.js': ['.js', '.jsx'],
      '.jsx': ['.js', '.jsx'],
    };

    const compatibleExtensions = compatibilityRules[
      sourceExt as keyof typeof compatibilityRules
    ] ?? [sourceExt];
    return compatibleExtensions.includes(targetExt);
  }

  public async validateTargetFile(filePath: string): Promise<boolean> {
    try {
      // Check if file exists and is writable
      await fs.access(filePath, constants.F_OK | constants.W_OK);
      return true;
    } catch (error) {
      this.logger.warn(`File validation failed for ${filePath}`, error);
      return false;
    }
  }

  public async showFileSelector(compatibleFiles: DiscoveredFile[]): Promise<string | undefined> {
    // Convert to legacy format for existing implementation
    const legacyFiles: CompatibleFile[] = compatibleFiles.map((f) => ({
      path: f.path,
      name: f.name,
      extension: f.extension,
      isCompatible: true,
      lastModified: new Date(), // We'll need to fetch this
      relativePath: f.relativePath ?? '',
    }));

    return this.showFileSelectorOld(legacyFiles);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use showFileSelector instead
   */
  private async showFileSelectorOld(
    compatibleFiles: CompatibleFile[],
  ): Promise<string | undefined> {
    if (compatibleFiles.length === 0) {
      vscode.window.showWarningMessage('No compatible files found in workspace');
      await this.accessibilityService.announce('No compatible files found', 'minimal');
      return undefined;
    }

    const quickPickItems = this.formatFileList(compatibleFiles);
    const placeholder = formatAccessiblePlaceholder('Select target file', compatibleFiles.length);

    const selected = (await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: placeholder,
      matchOnDescription: true,
      matchOnDetail: true,
    })) as FileQuickPickItem | undefined;

    if (selected) {
      const fileName = selected.label;
      await this.accessibilityService.announce(`Selected ${fileName}`, 'normal');
    }

    return selected?.filePath;
  }

  private formatFileList(files: CompatibleFile[]): FileQuickPickItem[] {
    return files.map((file, index) => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const workspaceName = workspaceFolder?.name ?? 'workspace';

      const fileName = file.name;
      const relativePath = file.relativePath;
      const directory = path.dirname(relativePath);
      const modificationInfo = file.lastModified.toLocaleString();

      // Create accessible description for screen readers
      const accessibleDescription = createAccessibleFileDescription(
        fileName,
        relativePath,
        file.lastModified,
      );

      // Create ARIA label with position information
      const ariaLabel = `${fileName}. File ${index + 1} of ${files.length}. Located in ${directory}. Last modified ${modificationInfo}`;

      const base = getAccessibleQuickPickItem(
        {
          label: file.name,
          description: directory,
          detail: `${workspaceName} • Modified: ${modificationInfo}`,
        },
        {
          ariaLabel,
          ariaDescription: accessibleDescription,
        },
      );
      return { ...base, filePath: file.path } as FileQuickPickItem;
    });
  }

  public clearCache(): void {
    this.fileCache.clear();
    this.logger.debug('File discovery cache cleared');
  }

  /**
   * Get cache statistics
   *
   * Returns statistics about the file discovery cache.
   *
   * @returns Cache statistics
   */
  public getCacheStats(): { size: number; hits: number; misses: number; hitRate: number } {
    return this.fileCache.getStats();
  }

  public dispose(): void {
    this.fileCache.dispose();
  }

  public onWorkspaceChanged(): vscode.Disposable {
    return vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.clearCache();
    });
  }

  public onFileSystemChanged(): vscode.Disposable {
    // Clear cache when files are created, deleted, or renamed
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,js,jsx}');

    const clearCache = () => this.clearCache();

    watcher.onDidCreate(clearCache);
    watcher.onDidDelete(clearCache);
    watcher.onDidChange(clearCache);

    return watcher;
  }

  private getLanguageId(extension: string): string {
    switch (extension) {
      case '.ts':
        return 'typescript';
      case '.tsx':
        return 'typescriptreact';
      case '.js':
        return 'javascript';
      case '.jsx':
        return 'javascriptreact';
      default:
        return 'unknown';
    }
  }

  public isExtensionSupported(extension: string): boolean {
    // Get supported extensions from configuration if available
    if (this.configService) {
      const supportedExtensions = this.configService.getSupportedExtensions();
      return supportedExtensions.includes(extension);
    }
    // Default check
    return ['.ts', '.tsx', '.js', '.jsx'].includes(extension);
  }
}
