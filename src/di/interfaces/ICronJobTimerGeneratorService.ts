/**
 * Cron Job Timer Generator Service Interface
 *
 * Defines the contract for generating cron expressions.
 *
 * @description
 * The cron job timer generator service interface provides:
 * - Cron expression generation via wizard
 * - Human-readable cron descriptions
 * - Common preset schedules
 * - Validation of cron expressions
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/ICronJobTimerGeneratorService
 */

/**
 * Cron expression components
 */
export interface CronExpression {
  /** Minute component (0-59) */
  minute: string;
  /** Hour component (0-23) */
  hour: string;
  /** Day of month component (1-31) */
  dayOfMonth: string;
  /** Month component (1-12) */
  month: string;
  /** Day of week component (0-6, 0=Sunday) */
  dayOfWeek: string;
}

/**
 * Common cron schedule presets
 */
export type CronPreset =
  | 'every-minute'
  | 'every-hour'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

/**
 * Cron Job Timer Generator Service Interface
 *
 * All cron generation operations must implement this interface.
 * The service is responsible for guiding users through creating
 * cron expressions with an interactive wizard.
 */
export interface ICronJobTimerGeneratorService {
  /**
   * Generate a cron expression via interactive wizard
   *
   * Shows a series of quick pick dialogs to build a cron expression
   * step by step. The user can choose from presets or customize
   * each component.
   *
   * @returns Promise that resolves when cron expression is generated
   */
  generateCronExpression(): Promise<void>;

  /**
   * Build a cron expression from components
   *
   * Combines the individual components into a full cron expression string.
   *
   * @param cron - The cron expression components
   * @returns The formatted cron expression string
   */
  buildCronExpression(cron: CronExpression): string;

  /**
   * Parse a cron expression into components
   *
   * Splits a cron expression string into its component parts.
   *
   * @param expression - The cron expression to parse
   * @returns The parsed cron components
   */
  parseCronExpression(expression: string): CronExpression;

  /**
   * Get a human-readable description of a cron expression
   *
   * Converts a cron expression into natural language description.
   *
   * @param expression - The cron expression to describe
   * @returns A human-readable description
   */
  describeCronExpression(expression: string): string;

  /**
   * Get preset cron expressions
   *
   * Returns a map of common schedule presets to their cron expressions.
   *
   * @returns Object mapping preset names to cron expressions
   */
  getPresetExpressions(): Record<CronPreset, string>;

  /**
   * Validate a cron expression
   *
   * Checks if the given string is a valid cron expression.
   *
   * @param expression - The expression to validate
   * @returns true if expression is valid
   */
  isValidCronExpression(expression: string): boolean;
}
