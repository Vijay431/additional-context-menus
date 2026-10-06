/**
 * Utilities Module
 *
 * Central export point for all utility classes and functions.
 *
 * - Logger / LogLevel / LogFormat / LogCategory: Centralized output-channel logging with structured JSON support.
 * - ConfigValidator / ValidationResult / ValidationError: Runtime validation of string-enum config settings with default fallback.
 * - accessibilityHelper: Functions for creating accessible QuickPick items, ARIA labels, and screen reader announcements.
 * - Cache / CacheConfig / CacheStats / createCache / memoize: Generic TTL-based cache with LRU eviction.
 * - IMetricCollector / MetricData: Interface and types for collecting operation performance metrics.
 * - isSafeFilePath: Guards against path traversal and dangerous file extensions.
 *
 * @category Utilities
 * @module utils
 */

export { Logger, LogLevel, LogFormat, LogCategory } from './logger';
export {
  ConfigValidator,
  validateExtensionConfig,
  validateConfigValue,
  formatValidationErrors,
  type ValidationResult,
  type ValidationError,
} from './configValidator';
export {
  getAccessibleLabel,
  announceToScreenReader,
  formatAccessiblePlaceholder,
  getAccessibleQuickPickItem,
  getAccessibleQuickPickItems,
  formatAccessibleInputPrompt,
  createAccessibleValidationMessage,
  getKeyboardNavigationHint,
  createAccessibleFileDescription,
  truncateForAccessibility,
} from './accessibilityHelper';
export { Cache, createCache, memoize, type CacheConfig, type CacheStats } from './cache';
export { type IMetricCollector, type MetricData } from './metrics';
export { isSafeFilePath, isPathWithin } from './pathValidator';
