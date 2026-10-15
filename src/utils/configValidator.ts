/**
 * Configuration Validator
 *
 * Runtime validation for extension configuration settings.
 * Validates string-enum settings against their allowed values and falls back
 * to documented defaults when invalid values are detected.
 *
 * @category Configuration
 * @module utils/configValidator
 */

import type { ILogger } from '../di/interfaces/ILogger';
import type { ExtensionConfig } from '../types/extension';

/** Allowed values for each string-enum setting */
const VALID_INSERTION_POINTS = ['smart', 'end', 'beginning'] as const;
const VALID_VERBOSITY = ['minimal', 'normal', 'verbose'] as const;
const VALID_TERMINAL_TYPES = ['integrated', 'external', 'system-default'] as const;
const VALID_OPEN_BEHAVIORS = ['parent-directory', 'workspace-root', 'current-directory'] as const;

/** Default values for each string-enum setting */
const DEFAULTS = {
  'copyCode.insertionPoint': 'smart' as const,
  'accessibility.verbosity': 'normal' as const,
  'terminal.type': 'integrated' as const,
  'terminal.openBehavior': 'parent-directory' as const,
};

/**
 * ConfigValidator
 *
 * Validates all string-enum configuration values on activation.
 * For any invalid value, logs a warning and substitutes the documented default.
 */
export class ConfigValidator {
  /**
   * Validate all string-enum settings in the extension configuration.
   *
   * For each invalid value, logs a warning identifying the key, received value,
   * and fallback value, then returns the config with the default substituted.
   *
   * @param config - The configuration object to validate
   * @param logger - Logger used to emit warnings for invalid values
   * @returns A new config object with invalid values replaced by their defaults
   */
  public static validate(config: ExtensionConfig, logger: ILogger): ExtensionConfig {
    // Deep-clone so we don't mutate the original
    const result: ExtensionConfig = {
      ...config,
      copyCode: { ...config.copyCode },
      saveAll: { ...config.saveAll },
      terminal: { ...config.terminal },
      keybindings: { ...config.keybindings },
      accessibility: { ...config.accessibility },
    };

    // copyCode.insertionPoint
    if (!(VALID_INSERTION_POINTS as readonly string[]).includes(result.copyCode.insertionPoint)) {
      const fallback = DEFAULTS['copyCode.insertionPoint'];
      logger.warn(
        `Invalid value for "copyCode.insertionPoint": "${result.copyCode.insertionPoint}". ` +
          `Falling back to default: "${fallback}". ` +
          `Valid values are: ${VALID_INSERTION_POINTS.join(', ')}.`,
      );
      result.copyCode.insertionPoint = fallback;
    }

    // accessibility.verbosity
    if (!(VALID_VERBOSITY as readonly string[]).includes(result.accessibility.verbosity)) {
      const fallback = DEFAULTS['accessibility.verbosity'];
      logger.warn(
        `Invalid value for "accessibility.verbosity": "${result.accessibility.verbosity}". ` +
          `Falling back to default: "${fallback}". ` +
          `Valid values are: ${VALID_VERBOSITY.join(', ')}.`,
      );
      result.accessibility.verbosity = fallback;
    }

    // terminal.type
    if (!(VALID_TERMINAL_TYPES as readonly string[]).includes(result.terminal.type)) {
      const fallback = DEFAULTS['terminal.type'];
      logger.warn(
        `Invalid value for "terminal.type": "${result.terminal.type}". ` +
          `Falling back to default: "${fallback}". ` +
          `Valid values are: ${VALID_TERMINAL_TYPES.join(', ')}.`,
      );
      result.terminal.type = fallback;
    }

    // terminal.openBehavior
    if (!(VALID_OPEN_BEHAVIORS as readonly string[]).includes(result.terminal.openBehavior)) {
      const fallback = DEFAULTS['terminal.openBehavior'];
      logger.warn(
        `Invalid value for "terminal.openBehavior": "${result.terminal.openBehavior}". ` +
          `Falling back to default: "${fallback}". ` +
          `Valid values are: ${VALID_OPEN_BEHAVIORS.join(', ')}.`,
      );
      result.terminal.openBehavior = fallback;
    }

    return result;
  }
}

/**
 * Configuration Validation Result
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
}

/**
 * Validation Error
 */
export interface ValidationError {
  /** The configuration key with the error */
  key: string;
  /** The error message */
  message: string;
  /** The invalid value */
  value: unknown;
  /** Optional suggestion for fixing the error */
  suggestion?: string;
}

/**
 * Validate Extension Configuration
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors if any
 */
export function validateExtensionConfig(
  config: import('../types/config').ExtensionConfiguration,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!VALID_INSERTION_POINTS.includes(config.copyCode.insertionPoint)) {
    errors.push({
      key: 'copyCode.insertionPoint',
      message: 'Invalid insertion point value',
      value: config.copyCode.insertionPoint,
      suggestion: `Must be one of: ${VALID_INSERTION_POINTS.join(', ')}`,
    });
  }

  if (!VALID_TERMINAL_TYPES.includes(config.terminal.type)) {
    errors.push({
      key: 'terminal.type',
      message: 'Invalid terminal type value',
      value: config.terminal.type,
      suggestion: `Must be one of: ${VALID_TERMINAL_TYPES.join(', ')}`,
    });
  }

  if (!VALID_OPEN_BEHAVIORS.includes(config.terminal.openBehavior)) {
    errors.push({
      key: 'terminal.openBehavior',
      message: 'Invalid open behavior value',
      value: config.terminal.openBehavior,
      suggestion: `Must be one of: ${VALID_OPEN_BEHAVIORS.join(', ')}`,
    });
  }

  if (!VALID_VERBOSITY.includes(config.accessibility.verbosity)) {
    errors.push({
      key: 'accessibility.verbosity',
      message: 'Invalid verbosity value',
      value: config.accessibility.verbosity,
      suggestion: `Must be one of: ${VALID_VERBOSITY.join(', ')}`,
    });
  }

  if (!Array.isArray(config.supportedExtensions)) {
    errors.push({
      key: 'supportedExtensions',
      message: 'Supported extensions must be an array',
      value: config.supportedExtensions,
    });
  } else {
    for (const ext of config.supportedExtensions) {
      if (typeof ext !== 'string' || !ext.startsWith('.')) {
        errors.push({
          key: 'supportedExtensions',
          message: 'Each supported extension must start with a dot',
          value: ext,
          suggestion: 'Example: .ts, .tsx, .js, .jsx',
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single configuration value against expected options.
 */
export function validateConfigValue<T extends string>(
  key: string,
  value: T,
  validValues: readonly T[],
): ValidationError | undefined {
  if (validValues.includes(value)) {
    return undefined;
  }
  return {
    key,
    message: `Invalid value for ${key}`,
    value,
    suggestion: `Must be one of: ${validValues.join(', ')}`,
  };
}

/**
 * Create a formatted error message from validation errors.
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }
  const lines = ['Configuration validation errors:', ''];
  for (const error of errors) {
    lines.push(`  - ${error.key}: ${error.message}`);
    if (error.suggestion) {
      lines.push(`    Suggestion: ${error.suggestion}`);
    }
  }
  return lines.join('\n');
}
