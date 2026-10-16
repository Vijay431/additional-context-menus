import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import * as vscode from 'vscode';

import { Logger } from '../utils/logger';
import { hasTraversalSegment, isPathWithin, isSafeFilePath } from '../utils/pathValidator';

/**
 * File Naming Convention Service
 *
 * Enforces and converts file naming conventions with validation,
 * renaming, and bulk operation support.
 *
 * @description
 * This service validates and enforces file naming conventions across
 * projects. Supports multiple naming conventions (kebab-case, camelCase, PascalCase,
 * snake_case, UPPER_CASE, Train-Case, dot.case) with single file
 * and bulk directory operations.
 *
 * Key Features:
 * - Convention validation for single files and directories
 * - Automatic conversion to selected convention
 * - Bulk rename operations with dry-run mode
 * - Multiple naming convention support (3 conventions)
 * - Diagnostic display for violations in VS Code
 * - Smart name conversion algorithms
 * - Conflict detection (file exists check)
 *
 * Supported Naming Conventions:
 * - kebab-case: my-component-name.ts
 * - camelCase: myComponentName.ts
 * - PascalCase: MyComponentName.ts
 * - dot.case: dot.case.name.ts
 *
 * Use Cases:
 * - Enforcing project naming standards
 * - Migrating to new naming convention
 * - Bulk file organization
 * - Code consistency across team
 * - Automated file renaming for large projects
 *
 * @example
 * // Get service instance
 * const namingService = FileNamingConventionService.getInstance();
 *
 * // Validate current file against kebab-case
 * const validation = namingService.validateFileName('/path/to/MyComponent.ts', 'kebab-case');
 * if (!validation.isValid) {
 *   console.log(`Should be: ${validation.suggestedName}`);
 * }
 *
 * // Rename file to convention
 * const result = await namingService.renameFile('/path/to/MyComponent.ts', 'kebab-case');
 * if (result.success) {
 *   console.log(`Renamed to: ${result.newPath}`);
 * }
 *
 * // Bulk rename directory
 * const bulkResult = await namingService.bulkRenameFiles(
 *   '/project',
 *   'kebab-case',
 *   { recursive: true },
 * );
 * console.log(`Renamed ${bulkResult.renamedFiles.length} files`);
 *
 * // Show rename suggestions to user
 * await namingService.showRenameSuggestions('kebab-case');
 *
 * @see ConfigurationService - May provide default convention settings
 *
 * @category File Operations
 * @subcategory Naming Conventions
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.3.0
 */

/**
 * Naming convention types
 */
export type NamingConvention = 'kebab-case' | 'camelCase' | 'PascalCase';

/**
 * Validation result for a single file
 */
export interface NamingViolation {
  fileName: string;
  filePath: string;
  expectedPattern: NamingConvention;
  actualName: string;
  suggestedName: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Result of naming convention validation
 */
export interface NamingValidationResult {
  isValid: boolean;
  violations: NamingViolation[];
  totalFilesChecked: number;
  validationDuration: number;
}

/**
 * Rename operation result
 */
export interface RenameResult {
  success: boolean;
  renamedFiles: { oldPath: string; newPath: string }[];
  failedFiles: { path: string; error: string }[];
  skippedFiles: number;
  totalFiles: number;
}

/**
 * File Naming Convention Service
 *
 * Validates file names against configurable conventions (kebab-case, camelCase, PascalCase).
 * Provides rename suggestions and bulk renaming capabilities.
 */
export class FileNamingConventionService {
  private static instance: FileNamingConventionService | undefined;
  private logger: Logger;
  private diagnosticCollection: vscode.DiagnosticCollection;

  // Regex patterns for different naming conventions
  private readonly patterns = {
    'kebab-case': /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // eslint-disable-line security/detect-unsafe-regex
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
  };

  private constructor() {
    this.logger = Logger.getInstance();
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('fileNamingConvention');
  }

  public static getInstance(): FileNamingConventionService {
    FileNamingConventionService.instance ??= new FileNamingConventionService();
    return FileNamingConventionService.instance;
  }

  /**
   * Validate a single file's name against naming conventions
   */
  public validateFileName(
    filePath: string,
    convention: NamingConvention,
  ): { isValid: boolean; suggestedName?: string } {
    const fileName = path.basename(filePath, path.extname(filePath));
    const pattern = this.patterns[convention as keyof typeof this.patterns];

    const isValid = pattern.test(fileName);

    if (!isValid) {
      return {
        isValid: false,
        suggestedName: this.convertToConvention(fileName, convention),
      };
    }

    return { isValid: true };
  }

  /**
   * Validate all files in a directory against naming conventions
   */
  public async validateDirectory(
    dirPath: string,
    convention: NamingConvention,
    options: {
      recursive?: boolean;
      ignorePatterns?: RegExp[];
      fileExtensions?: string[];
    } = {},
  ): Promise<NamingValidationResult> {
    const startTime = Date.now();
    const violations: NamingViolation[] = [];

    try {
      const { recursive = true, ignorePatterns = [], fileExtensions = [] } = options;

      // Get all files in directory
      const files = await this.getFilesInDirectory(dirPath, recursive, fileExtensions);

      // Check each file
      for (const file of files) {
        const fileName = path.basename(file, path.extname(file));

        // Check if file should be ignored
        if (this.shouldIgnoreFile(file, ignorePatterns)) {
          continue;
        }

        const validation = this.validateFileName(file, convention);

        if (!validation.isValid) {
          violations.push({
            fileName,
            filePath: file,
            expectedPattern: convention,
            actualName: fileName,
            suggestedName: validation.suggestedName ?? fileName,
            severity: 'warning',
          });
        }
      }

      const validationDuration = Date.now() - startTime;
      this.logger.debug(`Directory validation completed in ${validationDuration}ms`, {
        directory: dirPath,
        filesChecked: files.length,
        violationsFound: violations.length,
      });

      return {
        isValid: violations.length === 0,
        violations,
        totalFilesChecked: files.length,
        validationDuration,
      };
    } catch (error) {
      this.logger.error('Error validating directory', error);
      return {
        isValid: false,
        violations: [],
        totalFilesChecked: 0,
        validationDuration: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate the current workspace file
   */
  public async validateCurrentFile(convention: NamingConvention): Promise<NamingViolation | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return null;
    }

    const filePath = editor.document.fileName;
    const fileName = path.basename(filePath, path.extname(filePath));

    const validation = this.validateFileName(filePath, convention);

    if (!validation.isValid) {
      const violation: NamingViolation = {
        fileName,
        filePath,
        expectedPattern: convention,
        actualName: fileName,
        suggestedName: validation.suggestedName ?? fileName,
        severity: 'warning',
      };

      // Show diagnostic in the editor
      this.showDiagnostic(editor.document, violation);

      return violation;
    }

    vscode.window.showInformationMessage(
      `File name '${fileName}' follows the ${convention} convention.`,
    );
    return null;
  }

  /**
   * Rename a single file to follow the naming convention
   */
  public async renameFile(
    filePath: string,
    convention: NamingConvention,
  ): Promise<{ success: boolean; newPath?: string; error?: string }> {
    try {
      const validation = this.validateFileName(filePath, convention);

      if (validation.isValid) {
        return { success: true, newPath: filePath };
      }

      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const suggestedName = validation.suggestedName ?? path.basename(filePath, ext);
      const newPath = path.join(dir, `${suggestedName}${ext}`);

      // Check if target file already exists
      try {
        await fs.access(newPath);
        return {
          success: false,
          error: `File '${suggestedName}${ext}' already exists`,
        };
      } catch {
        // File doesn't exist, proceed with rename
      }

      // Perform rename
      const resolvedFilePath = path.resolve(filePath);
      const resolvedNewPath = path.resolve(newPath);
      if (
        !isSafeFilePath(resolvedFilePath) ||
        !isSafeFilePath(resolvedNewPath) ||
        !isPathWithin(path.dirname(resolvedFilePath), resolvedNewPath)
      ) {
        return { success: false, error: 'Path validation failed' };
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths validated by isSafeFilePath()
      await fs.rename(resolvedFilePath, resolvedNewPath);

      this.logger.info('File renamed successfully', {
        oldPath: filePath,
        newPath,
      });

      return { success: true, newPath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error renaming file', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Bulk rename files in a directory to follow the naming convention
   */
  public async bulkRenameFiles(
    dirPath: string,
    convention: NamingConvention,
    options: {
      recursive?: boolean;
      ignorePatterns?: RegExp[];
      fileExtensions?: string[];
      dryRun?: boolean;
    } = {},
  ): Promise<RenameResult> {
    const { recursive = true, ignorePatterns = [], fileExtensions = [], dryRun = false } = options;

    const startTime = Date.now();
    const renamedFiles: { oldPath: string; newPath: string }[] = [];
    const failedFiles: { path: string; error: string }[] = [];
    let skippedFiles = 0;

    try {
      // Get all files in directory
      const files = await this.getFilesInDirectory(dirPath, recursive, fileExtensions);

      this.logger.info('Starting bulk rename operation', {
        directory: dirPath,
        totalFiles: files.length,
        convention,
        dryRun,
      });

      // Rename each file that doesn't follow the convention
      for (const file of files) {
        // Check if file should be ignored
        if (this.shouldIgnoreFile(file, ignorePatterns)) {
          continue;
        }

        const validation = this.validateFileName(file, convention);

        if (!validation.isValid) {
          if (dryRun) {
            renamedFiles.push({
              oldPath: file,
              newPath: this.generateNewPath(file, validation.suggestedName ?? file),
            });
          } else {
            const result = await this.renameFile(file, convention);

            if (result.success && result.newPath && result.newPath !== file) {
              renamedFiles.push({ oldPath: file, newPath: result.newPath });
            } else if (!result.success) {
              failedFiles.push({
                path: file,
                error: result.error ?? 'Unknown error',
              });
            } else {
              skippedFiles++;
            }
          }
        } else {
          skippedFiles++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Bulk rename operation completed in ${duration}ms`, {
        renamedFiles: renamedFiles.length,
        skippedFiles,
        failedFiles: failedFiles.length,
      });

      return {
        success: failedFiles.length === 0,
        renamedFiles,
        failedFiles,
        skippedFiles,
        totalFiles: files.length,
      };
    } catch (error) {
      this.logger.error('Error during bulk rename', error);
      return {
        success: false,
        renamedFiles,
        failedFiles,
        skippedFiles,
        totalFiles: 0,
      };
    }
  }
  public async showRenameSuggestions(convention: NamingConvention): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const filePath = editor.document.fileName;
    const validation = this.validateFileName(filePath, convention);

    if (validation.isValid) {
      vscode.window.showInformationMessage(`File name already follows ${convention} convention.`);
      return;
    }

    const suggestedName = validation.suggestedName ?? path.basename(filePath);

    const selection = await vscode.window.showQuickPick(
      [
        {
          label: `Rename to '${suggestedName}'`,
          description: 'Rename the file to follow the convention',
          action: 'rename',
        },
        {
          label: 'Cancel',
          description: 'Do not rename the file',
          action: 'cancel',
        },
      ],
      {
        placeHolder: `File '${path.basename(filePath)}' does not follow ${convention} convention`,
      },
    );

    if (selection?.action === 'rename') {
      const result = await this.renameFile(filePath, convention);

      if (result.success && result.newPath) {
        // Open the renamed file
        const uri = vscode.Uri.file(result.newPath);
        await vscode.window.showTextDocument(uri);

        vscode.window.showInformationMessage(`File renamed to '${suggestedName}'`);
      } else {
        vscode.window.showErrorMessage(`Failed to rename file: ${result.error ?? 'Unknown error'}`);
      }
    }
  }

  /**
   * Clear diagnostics for a document
   */
  public clearDiagnostics(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  /**
   * Clear all diagnostics
   */
  public clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Rename a file or all files in a folder to the given convention.
   */
  public async renameByPath(
    targetPath: string,
    convention: NamingConvention,
  ): Promise<RenameResult> {
    try {
      const resolvedPath = path.resolve(targetPath);
      if (hasTraversalSegment(targetPath) || !isSafeFilePath(resolvedPath)) {
        return {
          success: false,
          renamedFiles: [],
          failedFiles: [{ path: targetPath, error: 'Path validation failed' }],
          skippedFiles: 0,
          totalFiles: 0,
        };
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated by isSafeFilePath()
      const stat = await fs.stat(resolvedPath);

      if (stat.isDirectory()) {
        return await this.bulkRenameFiles(resolvedPath, convention);
      }

      const result = await this.renameFile(resolvedPath, convention);
      if (result.success && result.newPath && result.newPath !== resolvedPath) {
        return {
          success: true,
          renamedFiles: [{ oldPath: resolvedPath, newPath: result.newPath }],
          failedFiles: [],
          skippedFiles: 0,
          totalFiles: 1,
        };
      }
      if (result.success) {
        return { success: true, renamedFiles: [], failedFiles: [], skippedFiles: 1, totalFiles: 1 };
      }
      return {
        success: false,
        renamedFiles: [],
        failedFiles: [{ path: resolvedPath, error: result.error ?? 'Unknown error' }],
        skippedFiles: 0,
        totalFiles: 1,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error in renameByPath', error);
      return {
        success: false,
        renamedFiles: [],
        failedFiles: [{ path: targetPath, error: errorMessage }],
        skippedFiles: 0,
        totalFiles: 0,
      };
    }
  }

  /**
   * Dispose the diagnostic collection
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }

  /**
   * Convert a file name to a specific naming convention
   */
  public convertToConvention(fileName: string, convention: NamingConvention): string {
    // Remove any existing separators and split into words
    const words = fileName
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length === 0) {
      return fileName;
    }

    switch (convention) {
      case 'kebab-case':
        return words.join('-');

      case 'camelCase':
        return (
          words[0] +
          words
            .slice(1)
            .map((word) => this.capitalize(word))
            .join('')
        );

      case 'PascalCase':
        return words.map((word) => this.capitalize(word)).join('');

      default:
        return fileName;
    }
  }

  /**
   * Capitalize the first letter of a word
   */
  private capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /**
   * Get all files in a directory
   */
  private async getFilesInDirectory(
    dirPath: string,
    recursive: boolean,
    fileExtensions: string[],
  ): Promise<string[]> {
    const files: string[] = [];

    const rootPath = path.resolve(dirPath);

    async function traverse(currentPath: string) {
      try {
        const resolvedPath = path.resolve(currentPath);
        if (!isPathWithin(rootPath, resolvedPath) || !isSafeFilePath(resolvedPath)) {
          return;
        }
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated by isSafeFilePath()
        const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory() && recursive) {
            await traverse(fullPath);
          } else if (entry.isFile()) {
            // Filter by extension if specified
            if (fileExtensions.length === 0 || fileExtensions.includes(path.extname(fullPath))) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    await traverse(dirPath);
    return files;
  }

  /**
   * Check if a file should be ignored based on ignore patterns
   */
  private shouldIgnoreFile(filePath: string, ignorePatterns: RegExp[]): boolean {
    const fileName = path.basename(filePath);

    for (const pattern of ignorePatterns) {
      if (pattern.test(fileName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate a new file path with the suggested name
   */
  private generateNewPath(originalPath: string, suggestedName: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    return path.join(dir, `${suggestedName}${ext}`);
  }

  /**
   * Show diagnostic for a naming violation
   */
  private showDiagnostic(document: vscode.TextDocument, violation: NamingViolation): void {
    const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));

    const diagnostic = new vscode.Diagnostic(
      range,
      `File name '${violation.actualName}' does not follow ` +
        `${violation.expectedPattern} convention. Suggested name: '${violation.suggestedName}'`,
      vscode.DiagnosticSeverity.Warning,
    );

    diagnostic.code = violation.expectedPattern;
    diagnostic.source = 'File Naming Convention';

    this.diagnosticCollection.set(document.uri, [diagnostic]);
  }
}
