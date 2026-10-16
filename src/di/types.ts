/**
 * Dependency Injection Types
 *
 * This file defines the dependency injection tokens used throughout the extension.
 * Tokens are used as unique identifiers for service bindings in the DI container.
 *
 * @description
 * The DI token pattern provides:
 * - Type-safe service resolution
 * - Unique identifiers for each service
 * - Support for multiple implementations of the same interface
 * - Avoids string-based service lookups
 *
 * @example
 * ```typescript
 * // Register a service
 * container.bind<Types.Logger>(TYPES.Logger).to(Logger);
 *
 * // Resolve a service
 * const logger = container.get<Types.Logger>(TYPES.Logger);
 * ```
 *
 * @category Dependency Injection
 * @module di/types
 */

/**
 * DI Token Symbol Type
 *
 * All DI tokens are symbols to ensure uniqueness and avoid naming conflicts.
 * Using symbols instead of strings provides:
 * - Guaranteed uniqueness across the application
 * - No accidental naming collisions
 * - Better IDE support and type safety
 */
export const TYPES = {
  /**
   * Logger service token
   * Provides centralized logging with output channel support
   */
  Logger: Symbol.for('Logger'),

  /**
   * Configuration service token
   * Manages VS Code configuration settings
   */
  ConfigurationService: Symbol.for('ConfigurationService'),

  /**
   * Project detection service token
   * Detects Node.js projects and framework types
   */
  ProjectDetectionService: Symbol.for('ProjectDetectionService'),

  /**
   * File discovery service token
   * Discovers compatible files with smart filtering
   */
  FileDiscoveryService: Symbol.for('FileDiscoveryService'),

  /**
   * Code analysis service token
   * Analyzes code for functions, imports, and patterns
   */
  CodeAnalysisService: Symbol.for('CodeAnalysisService'),

  /**
   * File save service token
   * Handles bulk file save operations
   */
  FileSaveService: Symbol.for('FileSaveService'),

  /**
   * Terminal service token
   * Provides cross-platform terminal integration
   */
  TerminalService: Symbol.for('TerminalService'),

  /**
   * Enum generator service token
   * Generates enums from union types
   */
  EnumGeneratorService: Symbol.for('EnumGeneratorService'),

  /**
   * Environment file generator service token
   * Creates .env files from usage patterns
   */
  EnvFileGeneratorService: Symbol.for('EnvFileGeneratorService'),

  /**
   * Cron job timer generator service token
   * Generates cron expressions with wizard
   */
  CronJobTimerGeneratorService: Symbol.for('CronJobTimerGeneratorService'),

  /**
   * File naming convention service token
   * Handles file renaming based on conventions
   */
  FileNamingConventionService: Symbol.for('FileNamingConventionService'),

  /**
   * Accessibility service token
   * Provides screen reader support and accessibility features
   */
  AccessibilityService: Symbol.for('AccessibilityService'),

  /**
   * Command registry token
   * Manages command registration and lifecycle
   */
  CommandRegistry: Symbol.for('CommandRegistry'),

  /**
   * Extension manager token
   * Main coordinator for extension lifecycle
   */
  ExtensionManager: Symbol.for('ExtensionManager'),
} as const;

/**
 * Type export for DI token type checking
 */
export type DiToken = (typeof TYPES)[keyof typeof TYPES];
