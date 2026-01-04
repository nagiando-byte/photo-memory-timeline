import { eq, inArray, and, desc, asc, SQL } from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { getDb } from '../models/db';

/**
 * Batch fetch records by IDs
 * More efficient than fetching one by one
 */
export async function batchFetchByIds<T extends MySqlTable>(
  table: T,
  idColumn: keyof T['_']['columns'],
  ids: string[]
): Promise<Map<string, T['$inferSelect']>> {
  if (ids.length === 0) {
    return new Map();
  }

  const db = getDb();
  const column = table[idColumn as keyof T] as unknown as SQL;

  const results = await db
    .select()
    .from(table)
    .where(inArray(column, ids));

  const resultMap = new Map<string, T['$inferSelect']>();
  for (const result of results) {
    resultMap.set((result as Record<string, unknown>)[idColumn as string] as string, result);
  }

  return resultMap;
}

/**
 * Paginate results efficiently
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: 'asc' | 'desc';
  orderColumn?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginatedResult<never>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Chunk array for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Process items in parallel with concurrency limit
 */
export async function parallelProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, concurrency);

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Deduplicate array by key
 */
export function deduplicateBy<T>(array: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Group array by key
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of array) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

/**
 * Efficient date range query helper
 */
export function dateRangeFilter(
  column: SQL,
  startDate?: Date,
  endDate?: Date
): SQL[] {
  const conditions: SQL[] = [];

  // Date range conditions would be added here
  // This is a placeholder for the actual implementation

  return conditions;
}

/**
 * Calculate photo statistics efficiently
 */
export interface PhotoStats {
  totalPhotos: number;
  analyzedPhotos: number;
  photosWithLocation: number;
  dateRange: {
    earliest?: Date;
    latest?: Date;
  };
}

/**
 * Memoize expensive function results
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ttlMs: number = 60000
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.value;
    }

    const value = fn(...args) as ReturnType<T>;
    cache.set(key, { value, timestamp: Date.now() });

    // Cleanup old entries periodically
    if (cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp > ttlMs) {
          cache.delete(k);
        }
      }
    }

    return value;
  }) as T;
}
