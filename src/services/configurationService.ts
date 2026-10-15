import * as vscode from 'vscode';

import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { ExtensionConfig } from '../types/extension';
import { Logger } from '../utils/logger';

/**
 * Configuration Service
 *
 * Manages VS Code configuration settings for the Additional Context Menus extension.
 * Provides type-safe access to extension settings with change event handling.
 *
 * @description
 * This service is the central configuration manager for the entire extension.
 * It handles reading, updating, and monitoring configuration changes
 * in VS Code's settings system.
 *
 * Key Features:
 * - Singleton pattern for global access across the extension
 * - Type-safe configuration retrieval with proper TypeScript types
 * - Automatic default value handling
 * - Configuration change event handling with filtering
 * - Update methods for individual settings or full config
 *
 * Configuration Structure:
 * - enabled: Enable/disable extension globally
 * - autoDetectProjects: Automatic project detection
 * - supportedExtensions: File extensions for context menu display
 * - copyCode: Settings for copy code operations
 * - saveAll: Settings for save all operation
 * - terminal: Terminal integration settings
 *
 * Use Cases:
 * - Checking if extension is enabled before showing menus
 * - Getting supported file extensions for filtering
 * - Retrieving copy/terminal settings for operations
 * - Listening for configuration changes to update UI
 * - Updating individual settings from user preferences
 *
 * @example
 * // Get configuration service instance
 * const configService = ConfigurationService.getInstance();
 *
 * // Check if extension is enabled
 * if (configService.isEnabled()) {
 *   console.log('Extension is active');
 * }
 *
 * // Get supported extensions
 * const extensions = configService.getSupportedExtensions();
 * console.log(`Supported: ${extensions.join(', ')}`);
 *
 * // Listen for configuration changes
 * const disposable = configService.onConfigurationChanged(() => {
 *   console.log('Settings changed');
 * });
 *
 * // Update a setting
 * await configService.updateConfiguration('enabled', false);
 *
 * @see ExtensionManager - Uses this service for configuration management
 * @see ContextMenuManager - Uses this service for feature toggles
 *
 * @category Configuration & State
 * @subcategory Settings Management
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.0.0
 */
export class ConfigurationService implements IConfigurationService {
  private static instance: ConfigurationService | undefined;
  private logger: ILogger;
  private readonly configSection = 'additionalContextMenus';

  private constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): ConfigurationService {
    ConfigurationService.instance ??= new ConfigurationService(Logger.getInstance());
    return ConfigurationService.instance;
  }

  /**
   * Create a new ConfigurationService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @returns A new ConfigurationService instance
   */
  public static create(logger: ILogger): ConfigurationService {
    return new ConfigurationService(logger);
  }

  /**
   * Get the complete extension configuration
   *
   * Returns all configuration settings with proper types and defaults.
   * Uses the new ExtensionConfiguration type for full type safety.
   *
   * @returns The complete extension configuration object
   */
  public getConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration(this.configSection);

    return {
      enabled: config.get<boolean>('enabled', true),
      autoDetectProjects: config.get<boolean>('autoDetectProjects', true),
      supportedExtensions: config.get<string[]>('supportedExtensions', [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
      ]),
      copyCode: {
        insertionPoint: config.get<'smart' | 'end' | 'beginning'>(
          'copyCode.insertionPoint',
          'smart',
        ),
        preserveComments: config.get<boolean>('copyCode.preserveComments', true),
      },
      saveAll: {
        showNotification: config.get<boolean>('saveAll.showNotification', true),
        skipReadOnly: config.get<boolean>('saveAll.skipReadOnly', true),
      },
      terminal: {
        type: config.get<'integrated' | 'external' | 'system-default'>(
          'terminal.type',
          'integrated',
        ),
        externalTerminalCommand: config.get<string>('terminal.externalTerminalCommand', ''),
        openBehavior: config.get<'parent-directory' | 'workspace-root' | 'current-directory'>(
          'terminal.openBehavior',
          'parent-directory',
        ),
      },
      keybindings: {
        enabled: config.get<boolean>('enableKeybindings', false),
        showInMenu: config.get<boolean>('showKeybindingsInMenu', true),
      },
      accessibility: {
        verbosity: config.get<'minimal' | 'normal' | 'verbose'>(
          'accessibility.verbosity',
          'normal',
        ),
        screenReaderMode: config.get<boolean>('accessibility.screenReaderMode', false),
        keyboardNavigation: config.get<boolean>('accessibility.keyboardNavigation', true),
      },
    };
  }

  /**
   * Get the complete extension configuration (new strongly-typed version)
   *
   * Returns all configuration settings with full type safety.
   *
   * @returns The complete extension configuration object with full type safety
   */
  public getConfigurationTyped(): import('../types/config').ExtensionConfiguration {
    const config = vscode.workspace.getConfiguration(this.configSection);

    return {
      enabled: config.get<boolean>('enabled', true),
      autoDetectProjects: config.get<boolean>('autoDetectProjects', true),
      supportedExtensions: config.get<string[]>('supportedExtensions', [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
      ]),
      copyCode: {
        insertionPoint: config.get<'smart' | 'end' | 'beginning'>(
          'copyCode.insertionPoint',
          'smart',
        ),
        preserveComments: config.get<boolean>('copyCode.preserveComments', true),
      },
      saveAll: {
        showNotification: config.get<boolean>('saveAll.showNotification', true),
        skipReadOnly: config.get<boolean>('saveAll.skipReadOnly', true),
      },
      terminal: {
        type: config.get<'integrated' | 'external' | 'system-default'>(
          'terminal.type',
          'integrated',
        ),
        externalTerminalCommand: config.get<string>('terminal.externalTerminalCommand', ''),
        openBehavior: config.get<'parent-directory' | 'workspace-root' | 'current-directory'>(
          'terminal.openBehavior',
          'parent-directory',
        ),
      },
      keybindings: {
        enabled: config.get<boolean>('enableKeybindings', false),
        showInMenu: config.get<boolean>('showKeybindingsInMenu', true),
      },
      accessibility: {
        verbosity: config.get<'minimal' | 'normal' | 'verbose'>(
          'accessibility.verbosity',
          'normal',
        ),
        screenReaderMode: config.get<boolean>('accessibility.screenReaderMode', false),
        keyboardNavigation: config.get<boolean>('accessibility.keyboardNavigation', true),
      },
    };
  }

  public isEnabled(): boolean {
    return this.getConfiguration().enabled;
  }

  public getSupportedExtensions(): string[] {
    return this.getConfiguration().supportedExtensions;
  }

  public shouldAutoDetectProjects(): boolean {
    return this.getConfiguration().autoDetectProjects;
  }

  public getCopyCodeConfig(): ExtensionConfig['copyCode'] {
    return this.getConfiguration().copyCode;
  }

  public getSaveAllConfig(): ExtensionConfig['saveAll'] {
    return this.getConfiguration().saveAll;
  }

  public getTerminalConfig(): ExtensionConfig['terminal'] {
    return this.getConfiguration().terminal;
  }

  public getFileDiscoveryCacheTTL(): number {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<number>('fileDiscovery.cacheTTL', 5 * 60 * 1000);
  }

  public onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        this.logger.info('Configuration changed');
        callback();
      }
    });
  }

  public async updateConfiguration<T>(
    key: string,
    value: T,
    target?: 'Global' | 'Workspace' | 'WorkspaceFolder' | undefined,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configSection);
    await config.update(key, value, target as unknown as vscode.ConfigurationTarget | undefined);
    this.logger.info(`Configuration updated: ${key} = ${JSON.stringify(value)}`);
  }
}
