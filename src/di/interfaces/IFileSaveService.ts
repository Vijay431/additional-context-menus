/**
 * File Save Service Interface
 *
 * Defines the contract for bulk file save operations with progress feedback.
 *
 * @description
 * The file save service interface provides:
 * - Bulk file save operations
 * - Progress feedback for multiple files
 * - Configurable skip behavior for read-only files
 * - Save notification options
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IFileSaveService
 */

/**
 * File save result information
 *
 * Contains metadata about a file save operation.
 */
export interface FileSaveResult {
  /** Number of files successfully saved */
  savedCount: number;
  /** Number of files skipped */
  skippedCount: number;
  /** Number of files that failed to save */
  failedCount: number;
  /** List of file paths that were saved */
  savedFiles: string[];
  /** List of file paths that were skipped */
  skippedFiles: string[];
  /** List of files that failed with error messages */
  failedFiles: { path: string; error: string }[];
}

/**
 * File Save Service Interface
 *
 * All file save operations must implement this interface.
 * The service is responsible for saving files with proper
 * progress feedback and error handling.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(
 *     @inject(TYPES.FileSaveService)
 *     private fileSave: IFileSaveService
 *   ) {}
 *
 *   async saveAll() {
 *     const result = await this.fileSave.saveAllFiles();
 *     console.log(`Saved ${result.savedCount} files`);
 *   }
 * }
 * ```
 */
export interface IFileSaveService {
  /**
   * Save all open text documents
   *
   * Saves all currently open files with optional progress feedback.
   * Respects configuration for skipping read-only files and notifications.
   *
   * @returns Promise resolving to save operation results
   */
  saveAllFiles(): Promise<FileSaveResult>;

  /**
   * Save a specific file
   *
   * Saves a single file by URI.
   *
   * @param uri - The URI of the file to save
   * @returns Promise that resolves when save is complete
   */
  saveFile(uri: { toString(): string }): Promise<void>;

  /**
   * Save multiple specific files
   *
   * Saves multiple files by URI with progress feedback.
   *
   * @param uris - Array of file URIs to save
   * @returns Promise resolving to save operation results
   */
  saveFiles(uris: { toString(): string }[]): Promise<FileSaveResult>;
}
