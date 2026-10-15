/**
 * Command Registry
 *
 * Central registry for managing command handlers and their lifecycle.
 * Provides command registration, disposal, and metadata management.
 *
 * @description
 * The CommandRegistry provides:
 * - Central command registration interface
 * - Command handler lifecycle management
 * - Command metadata (name, title, category)
 * - Integration with VS Code commands API
 * - Support for dynamic command enabling/disabling
 *
 * @category Commands
 * @module managers/CommandRegistry
 */

import * as vscode from 'vscode';

import type { CommandHandlerFactory } from '../commands';

/**
 * Command Metadata
 *
 * Contains information about a registered command.
 */
export interface CommandMetadata {
  /** The VS Code command ID */
  id: string;
  /** The command title shown to users */
  title: string;
  /** The command category */
  category: string;
  /** The command handler factory */
  handlerFactory: CommandHandlerFactory;
  /** Optional icon for the command */
  icon?: string;
}

/**
 * Command Registry
 *
 * Manages command registration and lifecycle.
 *
 * @example
 * ```typescript
 * const registry = new CommandRegistry();
 * registry.registerCommand({
 *   id: 'additionalContextMenus.copyFunction',
 *   title: 'Copy Function',
 *   category: 'Additional Context Menus',
 *   handlerFactory: () => new CopyFunctionCommand(...)
 * });
 * ```
 *
 * @category Commands
 * @subcategory Registration
 */
export class CommandRegistry {
  private readonly commands = new Map<
    string,
    { metadata: CommandMetadata; disposable: vscode.Disposable }
  >();
  private readonly disposables: vscode.Disposable[] = [];

  /**
   * Register a command
   *
   * @param metadata - The command metadata
   * @returns This registry for chaining
   */
  public registerCommand(metadata: CommandMetadata): this {
    const handler = metadata.handlerFactory();

    const disposable = vscode.commands.registerCommand(metadata.id, async () => {
      try {
        await handler.execute();
      } catch (error) {
        vscode.window.showErrorMessage(`Command '${metadata.title}' failed: ${error}`);
        console.error(`Command '${metadata.id}' error:`, error);
      }
    });

    this.commands.set(metadata.id, { metadata, disposable });
    this.disposables.push(disposable);

    return this;
  }

  /**
   * Register multiple commands
   *
   * @param commands - Array of command metadata
   * @returns This registry for chaining
   */
  public registerCommands(commands: CommandMetadata[]): this {
    for (const command of commands) {
      this.registerCommand(command);
    }
    return this;
  }

  /**
   * Execute a command by ID
   *
   * @param commandId - The command to execute
   * @param args - Optional arguments to pass to the command
   * @returns Promise that resolves when command is executed
   */
  public async executeCommand(commandId: string, ...args: unknown[]): Promise<unknown> {
    return vscode.commands.executeCommand(commandId, ...args);
  }

  /**
   * Get all registered commands
   *
   * @returns Array of registered command metadata
   */
  public getRegisteredCommands(): CommandMetadata[] {
    return Array.from(this.commands.values()).map(({ metadata }) => metadata);
  }

  /**
   * Check if a command is registered
   *
   * @param commandId - The command ID to check
   * @returns true if command is registered
   */
  public hasCommand(commandId: string): boolean {
    return this.commands.has(commandId);
  }

  /**
   * Get command metadata by ID
   *
   * @param commandId - The command ID
   * @returns The command metadata, or undefined if not found
   */
  public getCommand(commandId: string): CommandMetadata | undefined {
    return this.commands.get(commandId)?.metadata;
  }

  /**
   * Unregister a specific command
   *
   * @param commandId - The command ID to unregister
   */
  public unregisterCommand(commandId: string): void {
    const entry = this.commands.get(commandId);
    if (entry) {
      entry.disposable.dispose();
      this.commands.delete(commandId);
    }
  }

  /**
   * Dispose of all registered commands
   */
  public dispose(): void {
    // Dispose all command disposables
    for (const entry of this.commands.values()) {
      entry.disposable.dispose();
    }
    this.commands.clear();

    // Dispose registry disposables
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}
