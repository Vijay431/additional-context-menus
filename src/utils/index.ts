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
 * - isSafeFilePath: Sanity check (non-empty string, not a Windows executable/script extension). Does not check traversal.
 * - isPathWithin / hasTraversalSegment: Traversal guards; containment within a root and literal `..` segment detection.
 *
 * @category Utilities
 * @module utils
 */

export {
  announceToScreenReader,
  createAccessibleFileDescription,
  createAccessibleValidationMessage,
  formatAccessibleInputPrompt,
  formatAccessiblePlaceholder,
  getAccessibleLabel,
  getAccessibleQuickPickItem,
  getAccessibleQuickPickItems,
  getKeyboardNavigationHint,
  truncateForAccessibility,
} from './accessibilityHelper';
export { Cache, type CacheConfig, type CacheStats, createCache, memoize } from './cache';
export {
  ConfigValidator,
  formatValidationErrors,
  type ValidationError,
  type ValidationResult,
  validateConfigValue,
  validateExtensionConfig,
} from './configValidator';
export { LogCategory, LogFormat, Logger, LogLevel } from './logger';
export type { IMetricCollector, MetricData } from './metrics';
export { hasTraversalSegment, isPathWithin, isSafeFilePath } from './pathValidator';
