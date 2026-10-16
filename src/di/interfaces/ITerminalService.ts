/**
 * Terminal Service Interface
 *
 * Defines the contract for terminal integration operations.
 *
 * @description
 * The terminal service interface provides:
 * - Cross-platform terminal launching
 * - Multiple terminal type support (integrated, external, system-default)
 * - Configurable directory opening behavior
 * - Custom terminal commands
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/ITerminalService
 */

/**
 * Terminal type enumeration
 *
 * Defines the available terminal types.
 */
export type TerminalType = 'integrated' | 'external' | 'system-default';

/**
 * Terminal open behavior enumeration
 *
 * Defines where terminals should open.
 */
export type TerminalOpenBehavior = 'parent-directory' | 'workspace-root' | 'current-directory';

/**
 * Terminal Service Interface
 *
 * All terminal operations must implement this interface.
 * The service is responsible for opening terminals based on
 * user configuration and file context.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(
 *     @inject(TYPES.TerminalService)
 *     private terminal: ITerminalService
 *   ) {}
 *
 *   async openFileTerminal(filePath: string) {
 *     await this.terminal.openInTerminal(filePath);
 *   }
 * }
 * ```
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/ITerminalService
 */
export interface ITerminalService {
  /**
   * Open a terminal at the location of the given file
   *
   * @param filePath - Absolute path to the file
   * @returns Promise that resolves when terminal is opened
   */
  openInTerminal(filePath: string): Promise<void>;

  /**
   * Get configured terminal type
   *
   * @returns The configured terminal type
   */
  getTerminalType(): TerminalType;

  /**
   * Get configured open behavior
   *
   * @returns The configured open behavior
   */
  getOpenBehavior(): TerminalOpenBehavior;

  /**
   * Execute a command in a new terminal
   *
   * @param command - The command to execute
   * @param directoryPath - Optional directory to run command in
   * @returns Promise that resolves when command is executed
   */
  executeCommand(command: string, directoryPath?: string): Promise<void>;

  /**
   * Get the parent directory of a file
   *
   * @param filePath - The file path
   * @returns The parent directory path
   */
  getParentDirectory(filePath: string): string;

  /**
   * Validate if a path is a valid directory
   *
   * @param directoryPath - The directory path to validate
   * @returns Promise that resolves to true if valid
   */
  validatePath(directoryPath: string): Promise<boolean>;
}
