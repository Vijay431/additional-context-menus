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
export { EnableCommand, DisableCommand } from './EnableDisableCommands';
export { ShowOutputChannelCommand } from './ShowOutputChannelCommand';
export {
  DebugContextVariablesCommand,
  RefreshContextVariablesCommand,
} from './ContextVariableCommands';
export {
  CheckKeybindingConflictsCommand,
  EnableKeybindingsCommand,
  DisableKeybindingsCommand,
} from './KeybindingCommands';
export {
  LazyGeneratorCommand,
  GENERATE_ENUM_SPEC,
  GENERATE_ENV_FILE_SPEC,
  GENERATE_CRON_TIMER_SPEC,
  type LazyGeneratorSpec,
} from './LazyGeneratorCommand';

// Command handler factory type
export type CommandHandlerFactory = () => {
  execute: () => Promise<unknown>;
  dispose?: () => void;
};
