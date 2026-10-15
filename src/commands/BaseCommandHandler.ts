/**
 * Base Command Handler
 *
 * Abstract base class for all command handlers.
 * Provides common functionality like logging, error handling, and accessibility.
 *
 * @description
 * BaseCommandHandler provides:
 * - Common error handling with user notifications
 * - Logging integration
 * - Accessibility announcements
 * - Abstract execute method that all handlers must implement
 * - VS Code editor access utilities
 *
 * @category Commands
 * @module commands
 */

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';

import type { ICommandHandler } from './ICommandHandler';

/**
 * Command Execution Result
 *
 * Represents the result of a command execution.
 */
export interface CommandResult {
  /** Whether the command succeeded */
  success: boolean;
  /** User-friendly result message */
  message: string;
  /** Optional error details */
  error?: string;
}

/**
 * Abstract base class for all command handlers
 *
 * All command handlers should extend this class and implement
 * the abstract `execute()` method.
 *
 * @example
 * ```typescript
 * export class CopyFunctionCommand extends BaseCommandHandler {
 *   public async execute(): Promise<CommandResult> {
 *     const editor = vscode.window.activeTextEditor;
 *     if (!editor) {
 *       return this.error('No active editor found');
 *     }
 *
 *     // ... command logic
 *
 *     return this.success('Function copied to clipboard');
 *   }
 * }
 * ```
 *
 * @category Commands
 * @subcategory Base Classes
 */
export abstract class BaseCommandHandler implements ICommandHandler {
  /**
   * Create a new command handler
   *
   * @param name - The command name (for logging)
   * @param logger - The logger service
   * @param accessibilityService - The accessibility service
   */
  constructor(
    protected readonly name: string,
    protected readonly logger: ILogger,
    protected readonly accessibilityService: IAccessibilityService,
  ) {}

  /**
   * Execute the command
   *
   * This abstract method must be implemented by all command handlers.
   *
   * @returns Promise that resolves to the command result
   */
  public abstract execute(): Promise<CommandResult>;

  /**
   * Get the active text editor
   *
   * @returns The active text editor, or undefined if none
   */
  protected getActiveEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
  }

  /**
   * Get the active text editor or throw an error
   *
   * @returns The active text editor
   * @throws Error if no active editor
   */
  protected requireActiveEditor(): vscode.TextEditor {
    const editor = this.getActiveEditor();
    if (!editor) {
      throw new Error('No active editor found');
    }
    return editor;
  }

  /**
   * Check if there is a text selection
   *
   * @returns true if there is a selection
   */
  protected hasSelection(): boolean {
    const editor = this.getActiveEditor();
    return !editor?.selection.isEmpty;
  }

  /**
   * Get the selected text
   *
   * @returns The selected text, or undefined if no selection
   */
  protected getSelectedText(): string | undefined {
    const editor = this.getActiveEditor();
    if (!editor || editor.selection.isEmpty) {
      return undefined;
    }
    return editor.document.getText(editor.selection);
  }

  /**
   * Create a success result
   *
   * @param message - The success message
   * @returns Command result indicating success
   */
  protected success(message: string): CommandResult {
    return { success: true, message };
  }

  /**
   * Create an error result
   *
   * @param message - The error message
   * @param error - Optional error details
   * @returns Command result indicating failure
   */
  protected error(message: string, error?: unknown): CommandResult {
    const errorString = error instanceof Error ? error.message : String(error ?? '');
    return { success: false, message, error: errorString };
  }

  /**
   * Show an information message to the user
   *
   * @param message - The message to show
   */
  protected showInfo(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  /**
   * Show a warning message to the user
   *
   * @param message - The message to show
   */
  protected showWarning(message: string): void {
    vscode.window.showWarningMessage(message);
  }

  /**
   * Show an error message to the user
   *
   * @param message - The message to show
   */
  protected showError(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  /**
   * Announce a message to screen readers
   *
   * @param message - The message to announce
   * @param verbosity - The verbosity level
   */
  protected async announce(
    message: string,
    verbosity: 'minimal' | 'normal' | 'verbose' = 'normal',
  ): Promise<void> {
    await this.accessibilityService.announce(message, verbosity);
  }

  /**
   * Announce success to screen readers
   *
   * @param operation - The operation name
   * @param detail - Optional detail about the success
   */
  protected async announceSuccess(operation: string, detail?: string): Promise<void> {
    await this.accessibilityService.announceSuccess(operation, detail ?? '');
  }

  /**
   * Announce error to screen readers
   *
   * @param operation - The operation name
   * @param error - The error message
   */
  protected async announceError(operation: string, error: string): Promise<void> {
    await this.accessibilityService.announceError(operation, error);
  }

  /**
   * Log an info message
   *
   * @param message - The message to log
   * @param data - Optional data to log
   */
  protected logInfo(message: string, data?: unknown): void {
    this.logger.info(`[${this.name}] ${message}`, data);
  }

  /**
   * Log a debug message
   *
   * @param message - The message to log
   * @param data - Optional data to log
   */
  protected logDebug(message: string, data?: unknown): void {
    this.logger.debug(`[${this.name}] ${message}`, data);
  }

  /**
   * Log a warning message
   *
   * @param message - The message to log
   * @param data - Optional data to log
   */
  protected logWarn(message: string, data?: unknown): void {
    this.logger.warn(`[${this.name}] ${message}`, data);
  }

  /**
   * Log an error message
   *
   * @param message - The message to log
   * @param error - Optional error to log
   */
  protected logError(message: string, error?: unknown): void {
    this.logger.error(`[${this.name}] ${message}`, error);
  }
}
