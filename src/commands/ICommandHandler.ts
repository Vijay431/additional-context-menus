/**
 * ICommandHandler Interface
 *
 * Defines the contract that all command handlers must implement.
 * New commands can be added by creating a class that implements this interface
 * without modifying the command registration core.
 *
 * @category Commands
 * @module commands
 */

import type { CommandResult } from './BaseCommandHandler';

/**
 * Command Handler Interface
 *
 * All command handler classes must implement this interface.
 *
 * @example
 * ```typescript
 * export class MyCommand extends BaseCommandHandler implements ICommandHandler {
 *   public async execute(): Promise<CommandResult> {
 *     return this.success('Done');
 *   }
 * }
 * ```
 */
export interface ICommandHandler {
  /**
   * Execute the command
   *
   * @returns Promise that resolves to the command result
   */
  execute(): Promise<CommandResult>;
}
