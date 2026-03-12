const cache = new Map<string, unknown>()

export async function promiseResultCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key) as T
  }
  const result = await fn()
  cache.set(key, result)
  return result
}

export function promiseResultCacheClear(key: string) {
  cache.delete(key)
}

export function promiseResultCacheClearAll() {
  cache.clear()
}
