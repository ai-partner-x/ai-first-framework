/**
 * Cache 操作 DTO
 */
export interface CacheGetDto {
  name: string;
  key: string;
}

export interface CachePutDto {
  name: string;
  key: string;
  value: unknown;
  ttlSeconds?: number;
}

export interface CacheEvictDto {
  name: string;
  key?: string;
  allEntries?: boolean;
}

export interface CacheClearDto {
  name: string;
}
