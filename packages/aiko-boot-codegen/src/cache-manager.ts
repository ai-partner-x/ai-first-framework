/**
 * Cache Manager for Incremental Code Generation
 * Manages file hashes to enable incremental generation
 */
import * as crypto from 'crypto';
import * as fs from 'fs';

interface CacheEntry {
  hash: string;
  timestamp: number;
}

interface CacheData {
  [filePath: string]: CacheEntry;
}

const CACHE_FILE = '.codegen-cache.json';

/**
 * Calculate SHA-256 hash of a file content
 */
export function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Load cache from disk
 */
export function loadCache(): CacheData {
  try {
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(cacheContent);
  } catch (error) {
    return {};
  }
}

/**
 * Save cache to disk
 */
export function saveCache(cache: CacheData): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to save cache:', error);
  }
}

/**
 * Check if a file has changed since last generation
 */
export function hasFileChanged(filePath: string, content: string): boolean {
  const cache = loadCache();
  const currentHash = calculateHash(content);
  
  const cacheEntry = cache[filePath];
  if (!cacheEntry) {
    return true;
  }
  
  return cacheEntry.hash !== currentHash;
}

/**
 * Update cache entry for a file
 */
export function updateCacheEntry(filePath: string, content: string): void {
  const cache = loadCache();
  const currentHash = calculateHash(content);
  
  cache[filePath] = {
    hash: currentHash,
    timestamp: Date.now(),
  };
  
  saveCache(cache);
}

/**
 * Remove cache entry for a file
 */
export function removeCacheEntry(filePath: string): void {
  const cache = loadCache();
  delete cache[filePath];
  saveCache(cache);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { total: number; stale: number } {
  const cache = loadCache();
  const entries = Object.values(cache);
  const now = Date.now();
  const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  const stale = entries.filter(entry => (now - entry.timestamp) > staleThreshold).length;
  
  return {
    total: entries.length,
    stale,
  };
}

/**
 * Clean up stale cache entries
 */
export function cleanupStaleCache(): void {
  const cache = loadCache();
  const now = Date.now();
  const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  let cleaned = 0;
  for (const [filePath, entry] of Object.entries(cache)) {
    if ((now - entry.timestamp) > staleThreshold) {
      delete cache[filePath];
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    saveCache(cache);
    console.log(`Cleaned up ${cleaned} stale cache entries`);
  }
}
