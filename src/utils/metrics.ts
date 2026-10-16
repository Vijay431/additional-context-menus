/**
 * Metrics Collector
 *
 * Collects and reports performance metrics for the extension.
 * Provides timing information for operations and helps identify bottlenecks.
 *
 * @description
 * This module provides:
 * - Function execution timing
 * - File scan duration tracking
 * - Command execution metrics
 * - Export for analysis tools
 *
 * @category Monitoring
 * @module utils/metrics
 */

/**
 * Metric Data
 *
 * Contains information about a recorded metric.
 */
export interface MetricData {
  /** The name of the operation */
  operation: string;
  /** Duration in milliseconds */
  duration: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Optional error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Metric Collector Interface
 *
 * Interface for collecting performance metrics.
 */
export interface IMetricCollector {
  /**
   * Record a metric
   *
   * @param data - The metric data to record
   */
  record(data: MetricData): void;

  /**
   * Get all recorded metrics
   *
   * @returns Array of all recorded metrics
   */
  getMetrics(): MetricData[];

  /**
   * Clear all recorded metrics
   */
  clear(): void;

  /**
   * Get metrics summary
   *
   * @returns Summary of recorded metrics
   */
  getSummary(): {
    count: number;
    averageDuration: number;
    successRate: number;
  };
}
