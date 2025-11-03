/**
 * Simple in-memory cache for application data
 * Helps avoid unnecessary re-fetching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class AppCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  /**
   * Set a cache entry
   */
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }
  
  /**
   * Get a cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Check if cache has a valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Invalidate a cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const appCache = new AppCache();

/**
 * Cache keys for different types of data
 */
export const CACHE_KEYS = {
  SOLUTIONS_METADATA: 'solutions:metadata',
  SOLUTION: (id: string) => `solution:${id}`,
  NODE: (solutionId: string, nodeId: number) => `node:${solutionId}:${nodeId}`,
  SETTINGS: (path: string) => `settings:${path}`,
  EQUITY: (path: string) => `equity:${path}`,
} as const;

/**
 * Cache durations (in milliseconds)
 */
export const CACHE_DURATION = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  PERMANENT: 60 * 60 * 1000, // 1 hour
} as const;
