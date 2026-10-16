/**
 * Command Handlers Module
 *
 * Central export point for all command handler classes.
 *
 * @category Commands
 * @module commands
 */

export { BaseCommandHandler, type CommandResult } from './BaseCommandHandler';
export {
  DebugContextVariablesCommand,
  RefreshContextVariablesCommand,
} from './ContextVariableCommands';
export { CopyFileContentsCommand } from './CopyFileContentsCommand';
export { CopyFunctionCommand } from './CopyFunctionCommand';
export { CopyFunctionToFileCommand } from './CopyFunctionToFileCommand';
export { CopyLinesToFileCommand } from './CopyLinesToFileCommand';
export { DuplicateFileCommand } from './DuplicateFileCommand';
export { DisableCommand, EnableCommand } from './EnableDisableCommands';
export type { ICommandHandler } from './ICommandHandler';
export {
  CheckKeybindingConflictsCommand,
  DisableKeybindingsCommand,
  EnableKeybindingsCommand,
} from './KeybindingCommands';
export {
  GENERATE_CRON_TIMER_SPEC,
  GENERATE_ENUM_SPEC,
  GENERATE_ENV_FILE_SPEC,
  LazyGeneratorCommand,
  type LazyGeneratorSpec,
} from './LazyGeneratorCommand';
export { MoveFunctionToFileCommand } from './MoveFunctionToFileCommand';
export { MoveLinesToFileCommand } from './MoveLinesToFileCommand';
export { OpenInTerminalCommand } from './OpenInTerminalCommand';
export { RenameFileConventionCommand } from './RenameFileConventionCommand';
export { SaveAllCommand } from './SaveAllCommand';
export { ShowOutputChannelCommand } from './ShowOutputChannelCommand';

// Command handler factory type
export type CommandHandlerFactory = () => {
  execute: () => Promise<unknown>;
  dispose?: () => void;
};
