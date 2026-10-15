/**
 * Logger Service Interface
 *
 * Defines the contract for logging operations throughout the extension.
 * Implementations provide centralized logging with support for different
 * log levels and output destinations.
 *
 * @description
 * The logger interface provides:
 * - Multiple log levels (debug, info, warn, error)
 * - Output channel integration for VS Code
 * - Optional data/context attachment to log messages
 * - Configurable log level filtering
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/ILogger
 */

import type { LogLevel } from '../../utils/logger';

/**
 * Logger Interface
 *
 * All logging operations must implement this interface.
 * The logger is a dependency for most services and managers.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(@inject(TYPES.Logger) private logger: ILogger) {}
 *
 *   doSomething() {
 *     this.logger.info('Starting operation');
 *     try {
 *       // ... operation logic
 *       this.logger.info('Operation completed');
 *     } catch (error) {
 *       this.logger.error('Operation failed', error);
 *     }
 *   }
 * }
 * ```
 */
export interface ILogger {
  /**
   * Log a debug-level message
   *
   * Debug messages are only shown when log level is set to DEBUG.
   * Use for detailed diagnostic information during development.
   *
   * @param message - The log message
   * @param data - Optional data to attach to the log entry
   */
  debug(message: string, data?: unknown): void;

  /**
   * Log an info-level message
   *
   * Info messages are shown when log level is INFO or lower.
   * Use for general informational messages about normal operations.
   *
   * @param message - The log message
   * @param data - Optional data to attach to the log entry
   */
  info(message: string, data?: unknown): void;

  /**
   * Log a warning-level message
   *
   * Warning messages are shown when log level is WARN or lower.
   * Use for potentially harmful situations that don't prevent operation.
   *
   * @param message - The log message
   * @param data - Optional data to attach to the log entry
   */
  warn(message: string, data?: unknown): void;

  /**
   * Log an error-level message
   *
   * Error messages are always shown regardless of log level.
   * Use for error events that might still allow the application to continue.
   *
   * @param message - The log message
   * @param error - Optional error object or data
   */
  error(message: string, error?: unknown): void;

  /**
   * Set the minimum log level
   *
   * Messages below this level will be filtered out.
   * Default is LogLevel.INFO.
   *
   * @param level - The minimum log level to display
   */
  setLogLevel(level: LogLevel): void;

  /**
   * Show the output channel in VS Code
   *
   * Brings the output channel to the foreground for user viewing.
   */
  show(): void;

  /**
   * Dispose of logger resources
   *
   * Cleans up the output channel and any other resources.
   */
  dispose(): void;
}
