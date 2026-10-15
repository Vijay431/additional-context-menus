import * as vscode from 'vscode';

import type { IAccessibilityService, VerbosityLevel } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';
import { Logger } from '../utils/logger';

/**
 * Accessibility verbosity levels for screen reader announcements
 * @deprecated Use VerbosityLevel from IAccessibilityService instead
 */
export type AccessibilityVerbosity = 'minimal' | 'normal' | 'verbose';

/**
 * Accessibility configuration interface
 */
export interface AccessibilityConfig {
  verbosity: AccessibilityVerbosity;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

/**
 * Accessibility Service
 *
 * Centralized accessibility management for the extension.
 * Manages accessibility settings and provides screen reader announcements.
 * Implements IAccessibilityService for DI compatibility.
 *
 * @description
 * This service handles all accessibility-related functionality including:
 * - Reading and caching accessibility configuration
 * - Providing screen reader announcements via VS Code's accessibility API
 * - Centralizing accessibility logic for consistent behavior
 * - Supporting verbosity levels for different user needs
 *
 * Verbosity Levels:
 * - minimal: Only essential announcements (errors, critical operations)
 * - normal: Standard announcements for all operations (default)
 * - verbose: Detailed announcements including progress and contextual information
 *
 * Use Cases:
 * - Announcing operation completion to screen readers
 * - Providing accessible feedback for long-running operations
 * - Customizing announcement verbosity based on user preference
 * - Determining when to show enhanced accessibility features
 *
 * @example
 * ```typescript
 * // Using DI (recommended)
 * constructor(@inject(TYPES.AccessibilityService) private a11y: IAccessibilityService) {}
 *
 * // Using singleton (legacy)
 * const a11yService = AccessibilityService.getInstance();
 * await a11yService.announce('File saved successfully');
 * ```
 *
 * @category Accessibility
 * @subcategory Services
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 2.1.0
 */
export class AccessibilityService implements IAccessibilityService {
  private static instance: AccessibilityService | undefined;
  private logger: ILogger;
  private config: AccessibilityConfig;
  private configChangeListener: vscode.Disposable | undefined;

  private constructor(logger: ILogger) {
    this.logger = logger;
    this.config = this.loadConfiguration();
    this.watchConfigurationChanges();
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): AccessibilityService {
    AccessibilityService.instance ??= new AccessibilityService(Logger.getInstance());
    return AccessibilityService.instance;
  }

  /**
   * Create a new AccessibilityService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @returns A new AccessibilityService instance
   */
  public static create(logger: ILogger): AccessibilityService {
    return new AccessibilityService(logger);
  }

  /**
   * Load accessibility configuration from VS Code settings
   */
  private loadConfiguration(): AccessibilityConfig {
    const config = vscode.workspace.getConfiguration('additionalContextMenus.accessibility');

    return {
      verbosity: this.getVerbosityConfig(config),
      screenReaderMode: config.get<boolean>('screenReaderMode', false),
      keyboardNavigation: config.get<boolean>('keyboardNavigation', true),
    };
  }

  /**
   * Get verbosity setting with validation
   */
  private getVerbosityConfig(config: vscode.WorkspaceConfiguration): AccessibilityVerbosity {
    const verbosity = config.get<string>('verbosity', 'normal');
    if (this.isValidVerbosity(verbosity)) {
      return verbosity as AccessibilityVerbosity;
    }
    return 'normal';
  }

  /**
   * Validate verbosity value
   */
  private isValidVerbosity(value: string): value is AccessibilityVerbosity {
    return ['minimal', 'normal', 'verbose'].includes(value);
  }

  /**
   * Watch for configuration changes
   */
  private watchConfigurationChanges(): void {
    this.configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('additionalContextMenus.accessibility')) {
        this.config = this.loadConfiguration();
        this.logger.debug('Accessibility configuration updated', this.config);
      }
    });
  }

  /**
   * Get current accessibility configuration
   */
  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Get current verbosity level
   */
  public getVerbosity(): VerbosityLevel {
    return this.config.verbosity as VerbosityLevel;
  }

  /**
   * Set the verbosity level
   */
  public setVerbosity(verbosity: VerbosityLevel): void {
    this.config.verbosity = verbosity as AccessibilityVerbosity;
  }

  /**
   * Check if screen reader mode is enabled
   */
  public isScreenReaderEnabled(): boolean {
    return this.config.screenReaderMode;
  }

  /**
   * Check if keyboard navigation hints should be shown
   */
  public showKeyboardNavigationInternal(): boolean {
    return this.config.keyboardNavigation;
  }

  /**
   * Check if an announcement should be made based on verbosity level
   */
  public shouldAnnounceInternal(level: 'minimal' | 'normal' | 'verbose'): boolean {
    const verbosity = this.config.verbosity;

    // Minimal mode only announces minimal level
    if (verbosity === 'minimal' && level !== 'minimal') {
      return false;
    }

    // Normal mode announces minimal and normal
    if (verbosity === 'normal' && level === 'verbose') {
      return false;
    }

    return true;
  }

  /**
   * Announce a message to screen readers
   * Uses VS Code's accessibility API for proper screen reader support
   *
   * @param message - The message to announce
   * @param verbosity - The importance level (minimal, normal, verbose)
   * @returns Promise that resolves when announcement is made
   */
  public async announce(message: string, verbosity: VerbosityLevel = 'normal'): Promise<void> {
    if (!this.shouldAnnounce(verbosity)) {
      this.logger.debug(`Announcement skipped due to verbosity level: ${message}`);
      return;
    }

    try {
      // Use VS Code's accessibility API for screen reader announcements
      const vsCodeAny = vscode as unknown as {
        accessibility?: { announce(msg: string): Promise<void> };
      };
      if (vsCodeAny.accessibility) {
        await vsCodeAny.accessibility.announce(message);
      }

      this.logger.debug(`Accessibility announcement: ${message}`);
    } catch (error) {
      this.logger.error('Failed to make accessibility announcement', error);
    }
  }

  /**
   * Announce operation success
   */
  public async announceSuccess(operation: string, detail: string): Promise<void> {
    const message = detail ? `${operation} succeeded. ${detail}` : `${operation} succeeded`;
    await this.announce(message, 'normal');
  }

  /**
   * Announce operation failure
   */
  public async announceError(operation: string, error: string): Promise<void> {
    const message = `${operation} failed. ${error}`;
    await this.announce(message, 'minimal');
  }

  /**
   * Announce progress for long-running operations
   */
  public async announceProgress(operation: string, current: number, total: number): Promise<void> {
    const percentage = Math.round((current / total) * 100);
    const message = `${operation}: ${current} of ${total} complete, ${percentage}%`;
    await this.announce(message, 'verbose');
  }

  /**
   * Get an accessible label with count information
   */
  public formatWithCount(label: string, count: number): string {
    if (count === 1) {
      return `${label} (1 item)`;
    }
    return `${label} (${count} items)`;
  }

  /**
   * Create an accessible QuickPick item with proper labeling
   */
  public createAccessibleQuickPickItem<T extends vscode.QuickPickItem>(
    item: T,
    accessibility: { ariaLabel: string; ariaDescription?: string },
  ): T & { ariaLabel: string; ariaDescription?: string } {
    return {
      ...item,
      ariaLabel: accessibility.ariaLabel,
      ariaDescription: accessibility.ariaDescription ?? item.description,
    } as T & { ariaLabel: string; ariaDescription?: string };
  }

  /**
   * Enhance a Quick Pick options object for accessibility
   */
  public enhanceQuickPickOptions<T>(options: T): T {
    return options;
  }

  /**
   * Legacy compatibility methods
   * @deprecated Use interface methods instead
   */
  public isScreenReaderMode(): boolean {
    return this.isScreenReaderEnabled();
  }

  public showKeyboardNavigation(): boolean {
    return this.config.keyboardNavigation;
  }

  public shouldAnnounce(level: 'minimal' | 'normal' | 'verbose'): boolean {
    const verbosity = this.config.verbosity;

    // Minimal mode only announces minimal level
    if (verbosity === 'minimal' && level !== 'minimal') {
      return false;
    }

    // Normal mode announces minimal and normal
    if (verbosity === 'normal' && level === 'verbose') {
      return false;
    }

    return true;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.configChangeListener?.dispose();
  }
}
