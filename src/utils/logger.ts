import * as vscode from 'vscode';

import type { ILogger } from '../di/interfaces/ILogger';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogFormat {
  /** Simple text format (default) */
  TEXT = 'text',
  /** JSON format for structured logging */
  JSON = 'json',
}

export enum LogCategory {
  /** General logging category */
  GENERAL = 'general',
  /** Performance related logs */
  PERFORMANCE = 'performance',
  /** Operation related logs */
  OPERATION = 'operation',
  /** Security related logs */
  SECURITY = 'security',
}

/**
 * Logger Service
 *
 * Centralized logging with output channel support.
 * Implements ILogger interface for DI compatibility.
 *
 * @description
 * This service provides logging functionality with multiple levels:
 * - DEBUG: Detailed diagnostic information
 * - INFO: General informational messages
 * - WARN: Potentially harmful situations
 * - ERROR: Error events that might still allow application to continue
 *
 * The logger now supports structured logging with JSON format
 * and performance metrics collection.
 *
 * @example
 * ```typescript
 * // Using DI (recommended)
 * constructor(@inject(TYPES.Logger) private logger: ILogger) {}
 *
 * // Using singleton (legacy)
 * const logger = Logger.getInstance();
 * ```
 *
 * @category Logging
 * @category Utilities
 */
export class Logger implements ILogger {
  private static instance: Logger | undefined;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;
  private logFormat: LogFormat = LogFormat.TEXT;

  private constructor(outputChannel?: vscode.OutputChannel) {
    this.outputChannel =
      outputChannel ?? vscode.window.createOutputChannel('Additional Context Menus');
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): Logger {
    Logger.instance ??= new Logger();
    return Logger.instance;
  }

  /**
   * Create a new Logger instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param metricsCollector Optional metrics collector for performance tracking
   * @param outputChannel Optional VS Code output channel
   * @returns A new Logger instance
   */
  public static create(outputChannel?: vscode.OutputChannel): Logger {
    return new Logger(outputChannel);
  }

  /**
   * Set the log format (text or JSON)
   */
  public setLogFormat(format: LogFormat): void {
    this.logFormat = format;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data, LogCategory.GENERAL);
  }

  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data, LogCategory.GENERAL);
  }

  public warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data, LogCategory.GENERAL);
  }

  public error(message: string, error?: unknown): void {
    this.log(LogLevel.ERROR, message, error, LogCategory.GENERAL);
  }

  public show(): void {
    this.outputChannel.show();
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    category: LogCategory = LogCategory.GENERAL,
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    let levelName: string;
    switch (level) {
      case LogLevel.DEBUG:
        levelName = 'DEBUG';
        break;
      case LogLevel.INFO:
        levelName = 'INFO';
        break;
      case LogLevel.WARN:
        levelName = 'WARN';
        break;
      case LogLevel.ERROR:
        levelName = 'ERROR';
        break;
      default:
        levelName = 'UNKNOWN';
        break;
    }

    if (this.logFormat === LogFormat.JSON) {
      // Structured JSON logging
      const logEntry: Record<string, unknown> = {
        timestamp,
        level: levelName,
        category,
        message,
      };
      if (data) {
        logEntry['data'] = data;
      }
      this.outputChannel.appendLine(JSON.stringify(logEntry));
    } else {
      // Simple text format (default)
      const categoryPrefix = category !== LogCategory.GENERAL ? `[${category.toUpperCase()}] ` : '';
      const logMessage = `[${timestamp}] [${levelName}] ${categoryPrefix}${message}`;
      this.outputChannel.appendLine(logMessage);

      if (data) {
        this.outputChannel.appendLine(`Data: ${JSON.stringify(data, null, 2)}`);
      }
    }

    // Also log to console in development
    if (process.env['NODE_ENV'] === 'development') {
      const consoleMessage = `[${timestamp}] [${levelName}] ${message}`;
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(consoleMessage, data);
          break;
        case LogLevel.INFO:
          console.info(consoleMessage, data);
          break;
        case LogLevel.WARN:
          console.warn(consoleMessage, data);
          break;
        case LogLevel.ERROR:
          console.error(consoleMessage, data);
          break;
      }
    }
  }
}
