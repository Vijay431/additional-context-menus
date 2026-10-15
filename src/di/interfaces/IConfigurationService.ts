/**
 * Configuration Service Interface
 *
 * Defines the contract for accessing and managing VS Code configuration settings.
 * Provides type-safe access to extension configuration with change event handling.
 *
 * @description
 * The configuration service interface provides:
 * - Type-safe configuration retrieval
 * - Real-time configuration change monitoring
 * - Individual setting update methods
 * - Default value handling
 *
 * Configuration Structure:
 * - enabled: Enable/disable extension globally
 * - autoDetectProjects: Automatic project detection
 * - supportedExtensions: File extensions for context menu display
 * - copyCode: Settings for copy code operations
 * - saveAll: Settings for save all operation
 * - terminal: Terminal integration settings
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IConfigurationService
 */

import type { ExtensionConfig } from '../../types/extension';

/**
 * Configuration Service Interface
 *
 * All configuration operations must implement this interface.
 * The configuration service is a dependency for services that
 * need to access extension settings.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(
 *     @inject(TYPES.ConfigurationService)
 *     private configService: IConfigurationService
 *   ) {}
 *
 *   isEnabled(): boolean {
 *     return this.configService.isEnabled();
 *   }
 * }
 * ```
 */
export interface IConfigurationService {
  /**
   * Get the complete extension configuration
   *
   * Returns all configuration settings with proper types and defaults.
   *
   * @returns The complete extension configuration object
   */
  getConfiguration(): ExtensionConfig;

  /**
   * Check if the extension is enabled
   *
   * Uses the 'additionalContextMenus.enabled' setting.
   *
   * @returns true if extension is enabled, false otherwise
   */
  isEnabled(): boolean;

  /**
   * Get supported file extensions
   *
   * Returns the list of file extensions where context menus will be shown.
   * Uses the 'additionalContextMenus.supportedExtensions' setting.
   *
   * @returns Array of file extensions (e.g., ['.ts', '.tsx', '.js'])
   */
  getSupportedExtensions(): string[];

  /**
   * Check if automatic project detection is enabled
   *
   * Uses the 'additionalContextMenus.autoDetectProjects' setting.
   *
   * @returns true if auto-detection is enabled
   */
  shouldAutoDetectProjects(): boolean;

  /**
   * Get copy code configuration
   *
   * Returns settings related to copy/move code operations.
   *
   * @returns Copy code configuration object
   */
  getCopyCodeConfig(): ExtensionConfig['copyCode'];

  /**
   * Get save all configuration
   *
   * Returns settings related to bulk save operations.
   *
   * @returns Save all configuration object
   */
  getSaveAllConfig(): ExtensionConfig['saveAll'];

  /**
   * Get terminal configuration
   *
   * Returns settings related to terminal integration.
   *
   * @returns Terminal configuration object
   */
  getTerminalConfig(): ExtensionConfig['terminal'];

  /**
   * Get the file discovery cache TTL in milliseconds
   *
   * Uses the 'additionalContextMenus.fileDiscovery.cacheTTL' setting.
   *
   * @returns Cache TTL in ms (default 300000, i.e. 5 minutes)
   */
  getFileDiscoveryCacheTTL(): number;

  /**
   * Listen for configuration changes
   *
   * Registers a callback that will be invoked when any extension
   * configuration setting changes.
   *
   * @param callback - Function to call when configuration changes
   * @returns Disposable that stops listening when disposed
   */
  onConfigurationChanged(callback: () => void): { dispose: () => void };

  /**
   * Update a configuration setting
   *
   * Updates a single configuration value.
   *
   * @param key - The configuration key (without prefix)
   * @param value - The new value
   * @param target - Optional target (global, workspace, folder)
   * @returns Promise that resolves when update is complete
   */
  updateConfiguration<T>(
    key: string,
    value: T,
    target?: 'Global' | 'Workspace' | 'WorkspaceFolder' | undefined,
  ): Promise<void>;
}
