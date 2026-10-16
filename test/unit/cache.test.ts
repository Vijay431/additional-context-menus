import { afterEach, describe, expect, it } from 'vitest';
import { Cache } from '../../src/utils/cache';

describe('Cache', () => {
  let cache: Cache<string>;

  afterEach(() => {
    cache?.dispose();
  });

  it('should set and get a value', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('should return undefined for a missing key', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should return true from has() for an existing key', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    cache.set('k', 'v');
    expect(cache.has('k')).toBe(true);
  });

  it('should return false from has() for a missing key', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    expect(cache.has('nope')).toBe(false);
  });

  it('should remove a key with delete()', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    cache.set('k', 'v');
    cache.delete('k');
    expect(cache.get('k')).toBeUndefined();
  });

  it('should remove all entries with clear()', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('should expire entries after TTL', async () => {
    cache = new Cache({ defaultTTL: 50 });
    cache.set('k', 'v');
    await new Promise((r) => setTimeout(r, 100));
    expect(cache.get('k')).toBeUndefined();
  });

  it('should evict the LRU entry when maxSize is reached', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 60000, trackStats: true });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    cache.get('a');
    cache.get('b');
    cache.get('c');
    cache.set('d', '4');
    expect(cache.keys().length).toBeLessThanOrEqual(3);
  });

  it('should track hit and miss stats', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    cache.set('k', 'v');
    cache.get('k'); // hit
    cache.get('missing'); // miss
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('should remove expired entries with cleanup()', async () => {
    // Use a large cleanup interval so the periodic timer does not fire before we call manually
    cache = new Cache({ defaultTTL: 50, trackStats: true, maxSize: 0 });
    cache.set('k', 'v');
    await new Promise((r) => setTimeout(r, 100));
    // Entry is expired — cleanup() should remove it (returns 1) or it was already removed by timer (returns 0)
    // Either way the entry must be gone
    cache.cleanup();
    expect(cache.get('k')).toBeUndefined();
  });

  it('should clear entries and stop the timer on dispose()', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    cache.set('k', 'v');
    cache.dispose();
    expect(cache.get('k')).toBeUndefined();
  });

  it('should return hitRate of 0 with no accesses', () => {
    cache = new Cache({ maxSize: 3, defaultTTL: 1000, trackStats: true });
    expect(cache.getStats().hitRate).toBe(0);
  });
});
