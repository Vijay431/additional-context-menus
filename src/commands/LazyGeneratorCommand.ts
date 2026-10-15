/**
 * Lazy Generator Command
 *
 * Runs a generator service that lives in a separate lazily-loaded bundle
 * (`dist/lazy/<file>.js`). The module is loaded with a runtime `require` so it
 * stays out of the main bundle; do not convert these services to DI.
 *
 * @category Commands
 * @subcategory Generators
 */

import * as path from 'node:path';

import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { CommandResult } from './BaseCommandHandler';
import { BaseCommandHandler } from './BaseCommandHandler';
import type { ICommandHandler } from './ICommandHandler';

/** Describes a lazily loaded generator. */
export interface LazyGeneratorSpec {
  /** Command name (for the handler) */
  readonly name: string;
  /** Logged when the command is triggered */
  readonly triggerMessage: string;
  /** File name inside dist/lazy */
  readonly moduleFile: string;
  /** Exported class exposing getInstance() */
  readonly className: string;
  /** Instance method to invoke */
  readonly method: string;
  /** Logged on failure */
  readonly errorLogMessage: string;
  /** Shown to the user on failure, followed by the error message */
  readonly errorPrefix: string;
}

export const GENERATE_ENUM_SPEC: LazyGeneratorSpec = {
  name: 'GenerateEnum',
  triggerMessage: 'Generate Enum command triggered',
  moduleFile: 'enumGeneratorService.js',
  className: 'EnumGeneratorService',
  method: 'generateEnumFromSelection',
  errorLogMessage: 'Error generating enum',
  errorPrefix: 'Failed to generate enum',
};

export const GENERATE_ENV_FILE_SPEC: LazyGeneratorSpec = {
  name: 'GenerateEnvFile',
  triggerMessage: 'Generate Env File command triggered',
  moduleFile: 'envFileGeneratorService.js',
  className: 'EnvFileGeneratorService',
  method: 'generateEnvFile',
  errorLogMessage: 'Error generating env file',
  errorPrefix: 'Failed to generate env file',
};

export const GENERATE_CRON_TIMER_SPEC: LazyGeneratorSpec = {
  name: 'GenerateCronTimer',
  triggerMessage: 'Generate Cron Timer command triggered',
  moduleFile: 'cronJobTimerGeneratorService.js',
  className: 'CronJobTimerGeneratorService',
  method: 'generateCronExpression',
  errorLogMessage: 'Error generating cron timer',
  errorPrefix: 'Failed to generate cron timer',
};

/** Loads and runs a lazy generator service. */
export class LazyGeneratorCommand extends BaseCommandHandler implements ICommandHandler {
  constructor(
    private readonly spec: LazyGeneratorSpec,
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ) {
    super(spec.name, logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logInfo(this.spec.triggerMessage);
    try {
      // Load from lazy bundle at runtime
      const extensionPath = vscode.extensions.getExtension(
        'VijayGangatharan.additional-context-menus',
      )?.extensionPath;
      if (!extensionPath) {
        throw new Error('Extension path not found');
      }
      const lazyPath = path.join(extensionPath, 'dist', 'lazy', this.spec.moduleFile);
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, security/detect-non-literal-require
      const lazyModule = require(lazyPath);
      const service = lazyModule[this.spec.className].getInstance();
      await service[this.spec.method]();
      return this.success(`${this.spec.name} completed`);
    } catch (error) {
      this.logError(this.spec.errorLogMessage, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.showError(`${this.spec.errorPrefix}: ${errorMessage}`);
      return this.error(this.spec.errorPrefix, error);
    }
  }
}
