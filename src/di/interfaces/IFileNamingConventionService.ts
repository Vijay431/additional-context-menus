/**
 * File Naming Convention Service Interface
 *
 * Defines the contract for file renaming operations based on naming conventions.
 *
 * @description
 * The file naming convention service interface provides:
 * - File name conversion between conventions
 * - Interactive rename suggestion dialogs
 * - Support for common naming conventions (kebab-case, camelCase, PascalCase)
 * - Preview of rename operations
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IFileNamingConventionService
 */

/**
 * Supported naming conventions
 */
export type NamingConvention = 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';

/**
 * Result of a rename operation
 */
export interface RenameResult {
  success: boolean;
  renamedFiles: { oldPath: string; newPath: string }[];
  failedFiles: { path: string; error: string }[];
  skippedFiles: number;
  totalFiles: number;
}

/**
 * File Naming Convention Service Interface
 *
 * All file naming convention operations must implement this interface.
 * The service is responsible for converting file names between
 * different naming conventions and showing rename suggestions.
 */
export interface IFileNamingConventionService {
  /**
   * Show rename suggestions for the current file
   *
   * Displays a quick pick dialog with file name suggestions
   * in different naming conventions.
   *
   * @param convention - The naming convention to use for suggestions
   * @returns Promise that resolves when dialog is shown
   */
  showRenameSuggestions(convention: NamingConvention): Promise<void>;

  /**
   * Convert a file name to a specific convention
   *
   * Takes a file name (with or without extension) and converts
   * it to the specified naming convention.
   *
   * @param fileName - The file name to convert
   * @param convention - The target naming convention
   * @returns The converted file name (with extension preserved)
   */
  convertToConvention(fileName: string, convention: NamingConvention): string;

  /**
   * Rename the current file to a new name
   *
   * Performs the actual file rename operation.
   *
   * @param currentPath - The current file path
   * @param newName - The new file name
   * @returns Promise resolving to `{ success, newPath?, error? }`
   */
  renameFile(
    currentPath: string,
    newName: string,
  ): Promise<{ success: boolean; newPath?: string; error?: string }>;

  /**
   * Rename a file or all files in a folder to the given convention.
   *
   * @param targetPath - Absolute path to a file or directory
   * @param convention - The target naming convention
   * @returns Rename result with counts of renamed and failed files
   */
  renameByPath(targetPath: string, convention: NamingConvention): Promise<RenameResult>;
}
