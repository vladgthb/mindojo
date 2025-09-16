// Phase 5: Request caching and optimization service
// Intelligent caching for improved performance

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
  size: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  priority?: 'low' | 'normal' | 'high';
  persistent?: boolean;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalRequests: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

// Default cache settings
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ENTRIES = 1000;

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  // Generate cache key from URL and parameters
  generateKey(url: string, method: string = 'GET', params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    const baseKey = `${method}:${url}:${paramStr}`;
    
    // Hash long keys to prevent memory issues
    if (baseKey.length > 200) {
      return this.simpleHash(baseKey);
    }
    
    return baseKey;
  }

  // Simple hash function for long cache keys
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash)}`;
  }

  // Calculate approximate size of data
  private calculateSize(data: any): number {
    if (data === null || data === undefined) return 0;
    if (typeof data === 'string') return data.length * 2; // UTF-16
    if (typeof data === 'number') return 8;
    if (typeof data === 'boolean') return 1;
    
    try {
      return JSON.stringify(data).length * 2;
    } catch {
      return 1000; // Fallback estimate
    }
  }

  // Check if cache entry is expired
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Evict expired entries
  private evictExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Evict least recently used entries when cache is full
  private evictLRU(targetSize: number): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by hit count (ascending) and timestamp (ascending)
    entries.sort(([, a], [, b]) => {
      if (a.hitCount !== b.hitCount) {
        return a.hitCount - b.hitCount;
      }
      return a.timestamp - b.timestamp;
    });

    let currentSize = this.getTotalSize();
    
    for (const [key] of entries) {
      if (currentSize <= targetSize) break;
      
      const entry = this.cache.get(key);
      if (entry) {
        currentSize -= entry.size;
        this.cache.delete(key);
      }
    }
  }

  // Get total cache size
  private getTotalSize(): number {
    let total = 0;
    this.cache.forEach(entry => {
      total += entry.size;
    });
    return total;
  }

  // Set cache entry
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || DEFAULT_TTL;
    const size = this.calculateSize(data);
    const maxSize = options.maxSize || DEFAULT_MAX_SIZE;

    // Don't cache if item is too large
    if (size > maxSize * 0.1) { // Don't cache items larger than 10% of max cache size
      return;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hitCount: 0,
      size
    };

    // Evict expired entries first
    this.evictExpired();

    // Check if adding this entry would exceed limits
    const currentSize = this.getTotalSize();
    if (currentSize + size > maxSize || this.cache.size >= MAX_ENTRIES) {
      this.evictLRU(maxSize * 0.8); // Evict to 80% of max size
    }

    this.cache.set(key, entry);

    // Persist to localStorage if requested and available
    if (options.persistent && this.isLocalStorageAvailable()) {
      try {
        const persistKey = `cache_${key}`;
        localStorage.setItem(persistKey, JSON.stringify({
          data,
          timestamp: entry.timestamp,
          ttl
        }));
      } catch (error) {
        // localStorage might be full or disabled
        console.warn('Failed to persist cache entry:', error);
      }
    }
  }

  // Get cache entry
  get<T>(key: string): T | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key) as CacheEntry<T>;
    
    if (!entry) {
      this.stats.misses++;
      return this.getFromPersistent<T>(key);
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return this.getFromPersistent<T>(key);
    }

    // Update hit count and stats
    entry.hitCount++;
    this.stats.hits++;

    return entry.data;
  }

  // Get from localStorage
  private getFromPersistent<T>(key: string): T | null {
    if (!this.isLocalStorageAvailable()) return null;

    try {
      const persistKey = `cache_${key}`;
      const stored = localStorage.getItem(persistKey);
      
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const age = Date.now() - parsed.timestamp;
      
      if (age > parsed.ttl) {
        localStorage.removeItem(persistKey);
        return null;
      }

      // Restore to memory cache
      this.set(key, parsed.data, { ttl: parsed.ttl - age });
      
      return parsed.data;
    } catch {
      return null;
    }
  }

  // Check localStorage availability
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Delete cache entry
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    // Also remove from persistent storage
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(`cache_${key}`);
      } catch {
        // Ignore errors
      }
    }
    
    return deleted;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.totalRequests = 0;

    // Clear persistent cache
    if (this.isLocalStorageAvailable()) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // Ignore errors
      }
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    return {
      size: this.cache.size,
      hitRate: this.stats.totalRequests > 0 
        ? this.stats.hits / this.stats.totalRequests 
        : 0,
      totalHits: this.stats.hits,
      totalRequests: this.stats.totalRequests,
      memoryUsage: this.getTotalSize(),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  // Prefetch data for commonly used requests
  async prefetch<T>(
    key: string, 
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const existing = this.get<T>(key);
    
    if (existing !== null) {
      return existing;
    }

    try {
      const data = await fetcher();
      this.set(key, data, { ...options, priority: 'high' });
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Warm up cache with predefined data
  warmUp(entries: Array<{ key: string; data: any; options?: CacheOptions }>): void {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, { ttl: DEFAULT_TTL * 2, ...options });
    });
  }

  // Get cache efficiency metrics
  getEfficiencyMetrics() {
    const stats = this.getStats();
    const memoryEfficiency = stats.memoryUsage > 0 
      ? stats.size / (stats.memoryUsage / 1024) // entries per KB
      : 0;

    return {
      hitRate: stats.hitRate,
      memoryEfficiency,
      avgHitsPerEntry: stats.size > 0 ? stats.totalHits / stats.size : 0,
      cacheUtilization: stats.size / MAX_ENTRIES
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Utility decorators for automatic caching
export function cached<T extends any[], R>(
  options: CacheOptions & { keyGenerator?: (...args: T) => string } = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: T) {
      const keyGenerator = options.keyGenerator || ((...args) => 
        `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`
      );
      
      const cacheKey = keyGenerator(...args);
      const cached = cacheService.get<R>(cacheKey);
      
      if (cached !== null) {
        return cached;
      }
      
      const result = await originalMethod.apply(this, args);
      cacheService.set(cacheKey, result, options);
      
      return result;
    };
    
    return descriptor;
  };
}

// Request deduplication for identical concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

export async function dedupe<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

export default cacheService;