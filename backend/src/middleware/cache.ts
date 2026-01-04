import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  etag: string;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// Max cache size
const MAX_CACHE_SIZE = 1000;

/**
 * Generate a cache key from request
 */
function generateCacheKey(req: Request): string {
  const userId = req.user?.userId || 'anonymous';
  return `${userId}:${req.method}:${req.originalUrl}`;
}

/**
 * Generate ETag from data
 */
function generateEtag(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Clean expired entries from cache
 */
function cleanExpiredEntries(ttl: number): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > ttl) {
      cache.delete(key);
    }
  }
}

/**
 * Evict oldest entries if cache is too large
 */
function evictIfNeeded(): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 20%
    const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

/**
 * Cache middleware factory
 */
export function cacheMiddleware(ttlMs: number = DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cacheKey = generateCacheKey(req);
    const cached = cache.get(cacheKey);

    // Check if we have a valid cache entry
    if (cached && (Date.now() - cached.timestamp) < ttlMs) {
      // Check ETag for conditional request
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag === cached.etag) {
        res.status(304).end();
        return;
      }

      // Return cached data
      res.setHeader('ETag', cached.etag);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `private, max-age=${Math.floor(ttlMs / 1000)}`);
      res.json(cached.data);
      return;
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        evictIfNeeded();

        const etag = generateEtag(data);
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag,
        });

        res.setHeader('ETag', etag);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `private, max-age=${Math.floor(ttlMs / 1000)}`);
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cache for a user
 */
export function invalidateUserCache(userId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate specific cache pattern
 */
export function invalidateCachePattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}

// Periodically clean expired entries
setInterval(() => {
  cleanExpiredEntries(DEFAULT_TTL);
}, 60 * 1000);
