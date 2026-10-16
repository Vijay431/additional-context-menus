/**
 * File Discovery Service Interface
 *
 * Defines the contract for discovering compatible files in the workspace.
 * Provides smart filtering based on project type and file extensions.
 *
 * @description
 * The file discovery service interface provides:
 * - Smart file discovery with caching
 * - File extension compatibility checking
 * - File validation for read/write operations
 * - Quick pick file selector integration
 * - File system change monitoring
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IFileDiscoveryService
 */

/**
 * Discovered file information
 *
 * Contains metadata about files discovered by the service.
 */
export interface DiscoveredFile {
  /** Absolute file path */
  path: string;
  /** File name without path */
  name: string;
  /** File extension (e.g., '.ts', '.tsx') */
  extension: string;
  /** Relative path from workspace root (if available) */
  relativePath?: string;
  /** Language ID based on extension */
  languageId: string;
}

/**
 * File Discovery Service Interface
 *
 * All file discovery operations must implement this interface.
 * The service is responsible for finding compatible files
 * in the workspace with intelligent filtering.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(
 *     @inject(TYPES.FileDiscoveryService)
 *     private fileDiscovery: IFileDiscoveryService
 *   ) {}
 *
 *   async findTargetFile(extension: string) {
 *     const files = await this.fileDiscovery.getCompatibleFiles(extension);
 *     const selected = await this.fileDiscovery.showFileSelector(files);
 *     return selected;
 *   }
 * }
 * ```
 */
export interface IFileDiscoveryService {
  /**
   * Get all compatible files in the workspace
   *
   * Searches the workspace for files that match the given extension
   * and are compatible with the current project context.
   *
   * @param extension - File extension to filter by (e.g., '.ts', '.tsx')
   * @returns Array of discovered files
   */
  getCompatibleFiles(extension: string): Promise<DiscoveredFile[]>;

  /**
   * Show file selector quick pick
   *
   * Displays a VS Code quick pick dialog for file selection.
   * Files are grouped by folder for easier navigation.
   *
   * @param files - Array of files to display
   * @returns Promise resolving to selected file path, or undefined if cancelled
   */
  showFileSelector(files: DiscoveredFile[]): Promise<string | undefined>;

  /**
   * Validate if a target file is accessible and writable
   *
   * Checks if the file exists and can be written to.
   * Creates the file if it doesn't exist.
   *
   * @param filePath - Absolute path to the file
   * @returns true if file is valid for operations, false otherwise
   */
  validateTargetFile(filePath: string): Promise<boolean>;

  /**
   * Clear the file discovery cache
   *
   * Clears cached file lists to force re-discovery.
   * Call this when the workspace structure changes.
   */
  clearCache(): void;

  /**
   * Get cache hit/miss statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number; hitRate: number };

  /**
   * Release resources held by the service
   */
  dispose(): void;

  /**
   * Listen for file system changes
   *
   * Sets up watchers for file system changes that affect
   * file discovery results.
   *
   * @returns Disposable that cleans up watchers when disposed
   */
  onFileSystemChanged(): { dispose: () => void };

  /**
   * Check if a file extension is supported
   *
   * Determines if the given extension is in the list of
   * supported file extensions from configuration.
   *
   * @param extension - File extension to check (e.g., '.ts', '.tsx')
   * @returns true if extension is supported
   */
  isExtensionSupported(extension: string): boolean;
}
