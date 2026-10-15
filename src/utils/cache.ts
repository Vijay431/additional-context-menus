/**
 * Cache Utility
 *
 * Provides caching with expiration and smart invalidation.
 *
 * @description
 * This utility provides:
 * - Time-based cache expiration
 * - Size-based cache limits
 * - Smart cache invalidation
 * - Cache statistics for monitoring
 *
 * @category Utilities
 * @module utils/cache
 */

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  /** The cached value */
  value: T;
  /** When the entry was created (timestamp) */
  createdAt: number;
  /** When the entry expires (timestamp) */
  expiresAt: number;
  /** Number of times this entry was accessed */
  accessCount: number;
  /** Last access time (timestamp) */
  lastAccessAt: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum number of entries to store (0 = unlimited) */
  maxSize: number;
  /** Default time-to-live in milliseconds (0 = no expiration) */
  defaultTTL: number;
  /** Whether to track access statistics */
  trackStats: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Current number of entries */
  size: number;
  /** Total number of cache hits */
  hits: number;
  /** Total number of cache misses */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
  /** Number of expired entries removed */
  expired: number;
  /** Number of evicted entries (due to size limit) */
  evicted: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  trackStats: true,
};

/**
 * Cache class
 *
 * Generic cache with expiration and size limits.
 *
 * @example
 * ```typescript
 * const cache = new Cache<string>({
 *   maxSize: 50,
 *   defaultTTL: 60000, // 1 minute
 * });
 *
 * cache.set('key', 'value');
 * const value = cache.get('key'); // Returns cached value
 * ```
 */
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    expired: 0,
    evicted: 0,
  };
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };

    // Periodic cleanup of expired entries
    if (this.config.defaultTTL > 0) {
      this.cleanupTimer = setInterval(
        () => {
          this.cleanup();
        },
        Math.min(this.config.defaultTTL, 60000),
      ); // Cleanup at most every minute
    }
  }

  /**
   * Set a value in the cache
   *
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Optional TTL in milliseconds (overrides default)
   */
  public set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl ?? this.config.defaultTTL;

    // Enforce size limit by evicting least recently used entries
    if (this.config.maxSize > 0 && this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt: entryTTL > 0 ? now + entryTTL : Number.MAX_SAFE_INTEGER,
      accessCount: 0,
      lastAccessAt: now,
    });
  }

  /**
   * Get a value from the cache
   *
   * Returns undefined if key doesn't exist or entry has expired.
   *
   * @param key - The cache key
   * @returns The cached value or undefined
   */
  public get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.expired++;
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessAt = Date.now();
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   *
   * @param key - The cache key
   * @returns true if key exists and is valid
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.expired++;
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key
   *
   * @param key - The cache key to delete
   * @returns true if key was deleted
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  public clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, expired: 0, evicted: 0 };
  }

  /**
   * Get cache statistics
   *
   * @returns Current cache statistics
   */
  public getStats(): CacheStats {
    const totalAccesses = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalAccesses > 0 ? this.stats.hits / totalAccesses : 0,
      expired: this.stats.expired,
      evicted: this.stats.evicted,
    };
  }

  /**
   * Get all current keys (including expired)
   *
   * @returns Array of cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clean up expired entries
   *
   * Removes all entries that have passed their expiration time.
   *
   * @returns Number of entries removed
   */
  public cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    this.stats.expired += removed;
    return removed;
  }

  /**
   * Evict least recently used entry
   *
   * Removes the entry with the oldest lastAccessAt time.
   */
  private evictLRU(): void {
    let lruKey: string | undefined;
    let lruTime = Number.MAX_SAFE_INTEGER;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessAt < lruTime) {
        lruTime = entry.lastAccessAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evicted++;
    }
  }

  /**
   * Dispose the cache
   *
   * Clears all entries and stops cleanup timer.
   */
  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

/**
 * Create a cache with default configuration
 *
 * Convenience factory function.
 *
 * @param config - Optional cache configuration
 * @returns A new cache instance
 */
export function createCache<T>(config?: Partial<CacheConfig>): Cache<T> {
  return new Cache<T>(config);
}

/**
 * Memoization decorator
 *
 * Caches function results based on arguments.
 *
 * @example
 * ```typescript
 * class MyService {
 *   @memoize()
 *   public async expensiveOperation(input: string): Promise<Result> {
 *     // This will be cached based on input
 *   }
 * }
 * ```
 */
export function memoize(
  ttl?: number,
  keyGenerator?: (...args: unknown[]) => string,
): MethodDecorator {
  return (_target: unknown, _propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const cacheConfig: Partial<CacheConfig> = {};
    if (ttl !== undefined) {
      cacheConfig.defaultTTL = ttl;
    }
    const cache = new Cache<unknown>(cacheConfig);

    descriptor.value = function (...args: unknown[]) {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(args)
        : `${_propertyKey.toString()}:${JSON.stringify(args)}`;

      // Check cache
      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Call original and cache result
      const result = originalMethod.apply(this, args);
      cache.set(cacheKey, result);
      return result;
    };

    return descriptor;
  };
}
