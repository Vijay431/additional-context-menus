/**
 * Accessibility Service Interface
 *
 * Defines the contract for accessibility features including
 * screen reader support and enhanced announcements.
 *
 * @description
 * The accessibility service interface provides:
 * - Screen reader announcements
 * - ARIA label generation for Quick Pick items
 * - Configurable verbosity levels
 * - Keyboard navigation hints
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IAccessibilityService
 */

import type * as vscode from 'vscode';

/**
 * Accessibility verbosity levels
 */
export type VerbosityLevel = 'minimal' | 'normal' | 'verbose';

/**
 * Accessibility announcement options
 */
export interface AnnouncementOptions {
  /** Whether to force the announcement even if screen reader is off */
  force?: boolean;
  /** Priority level for the announcement */
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Accessibility Service Interface
 *
 * All accessibility operations must implement this interface.
 * The service is responsible for providing screen reader support
 * and accessibility enhancements throughout the extension.
 */
export interface IAccessibilityService {
  /**
   * Announce a message to screen readers
   *
   * Uses VS Code's API to make an accessibility announcement.
   * Respects the configured verbosity level.
   *
   * @param message - The message to announce
   * @param verbosity - The verbosity level for this announcement
   * @returns Promise that resolves when announcement is made
   */
  announce(message: string, verbosity: VerbosityLevel): Promise<void>;

  /**
   * Announce a successful operation
   *
   * Convenience method for success announcements.
   *
   * @param operation - Name of the operation that succeeded
   * @param detail - Additional detail about the success
   * @returns Promise that resolves when announcement is made
   */
  announceSuccess(operation: string, detail: string): Promise<void>;

  /**
   * Announce an error
   *
   * Convenience method for error announcements.
   *
   * @param operation - Name of the operation that failed
   * @param error - Error message or details
   * @returns Promise that resolves when announcement is made
   */
  announceError(operation: string, error: string): Promise<void>;

  /**
   * Announce progress for long-running operations
   *
   * @param operation - Name of the operation in progress
   * @param current - Current step number
   * @param total - Total number of steps
   * @returns Promise that resolves when announcement is made
   */
  announceProgress(operation: string, current: number, total: number): Promise<void>;

  /**
   * Check if screen reader mode is enabled
   *
   * Returns whether enhanced screen reader support is active.
   *
   * @returns true if screen reader mode is enabled
   */
  isScreenReaderEnabled(): boolean;

  /**
   * Get the current verbosity level
   *
   * Returns the configured verbosity for announcements.
   *
   * @returns The current verbosity level
   */
  getVerbosity(): VerbosityLevel;

  /**
   * Set the verbosity level
   *
   * Updates the verbosity for future announcements.
   *
   * @param verbosity - The new verbosity level
   */
  setVerbosity(verbosity: VerbosityLevel): void;

  /**
   * Create an accessible Quick Pick item
   *
   * Generates a Quick Pick item with proper ARIA labels
   * and descriptions for screen reader users.
   *
   * @param item - The base Quick Pick item
   * @param accessibility - ARIA label and description
   * @returns An accessible Quick Pick item
   */
  createAccessibleQuickPickItem<T extends vscode.QuickPickItem>(
    item: T,
    accessibility: { ariaLabel: string; ariaDescription?: string },
  ): T & { ariaLabel: string; ariaDescription?: string };

  /**
   * Enhance a Quick Pick options object for accessibility
   *
   * Adds appropriate accessibility properties to Quick Pick options.
   *
   * @param options - The base Quick Pick options
   * @returns Enhanced options with accessibility support
   */
  enhanceQuickPickOptions<T>(options: T): T;
}
