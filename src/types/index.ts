/**
 * Types Module
 *
 * Central export point for all shared TypeScript types and interfaces.
 *
 * - config.ts: Strongly-typed configuration interfaces (ExtensionConfiguration, CopyCodeConfig,
 *   TerminalConfig, etc.), default values, config key constants, and type-guard/validation helpers.
 * - extension.ts: Domain types used across the extension (ExtensionConfig, ProjectType,
 *   CompatibleFile, FunctionInfo, SaveAllResult, etc.).
 * - vscode.ts: Re-exports of VS Code API types to reduce direct vscode module coupling.
 *
 * @category Types
 * @module types
 */

export {
  type AccessibilityConfig,
  CONFIG_KEYS,
  type CopyCodeConfig,
  DEFAULT_CONFIG,
  type ExtensionConfiguration,
  isCopyCodeConfig,
  isSaveAllConfig,
  isTerminalConfig,
  isValidInsertionPoint,
  isValidOpenBehavior,
  isValidTerminalType,
  isValidVerbosity,
  type KeybindingsConfig,
  type SaveAllConfig,
  type TerminalConfig,
} from './config';

export type {
  CompatibleFile,
  CopyConflictResolution,
  CopyValidation,
  ExtensionConfig,
  FunctionInfo,
  MoveValidation,
  ProjectType,
  SaveAllFeedback,
  SaveAllResult,
} from './extension';

export { vscode } from './vscode';
