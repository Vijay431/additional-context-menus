/**
 * Command Handlers Module
 *
 * Central export point for all command handler classes.
 *
 * @category Commands
 * @module commands
 */

export { BaseCommandHandler, type CommandResult } from './BaseCommandHandler';
export type { ICommandHandler } from './ICommandHandler';
export { CopyFunctionCommand } from './CopyFunctionCommand';
export { SaveAllCommand } from './SaveAllCommand';
export { OpenInTerminalCommand } from './OpenInTerminalCommand';
export { CopyLinesToFileCommand } from './CopyLinesToFileCommand';
export { MoveLinesToFileCommand } from './MoveLinesToFileCommand';
export { CopyFunctionToFileCommand } from './CopyFunctionToFileCommand';
export { MoveFunctionToFileCommand } from './MoveFunctionToFileCommand';
export { RenameFileConventionCommand } from './RenameFileConventionCommand';
export { CopyFileContentsCommand } from './CopyFileContentsCommand';
export { DuplicateFileCommand } from './DuplicateFileCommand';

// Command handler factory type
export type CommandHandlerFactory = () => {
  execute: () => Promise<unknown>;
  dispose?: () => void;
};
