/**
 * Storage Starter 生命周期顺序常量
 *
 * 约定：
 * - ORM: -100
 * - Storage: -90
 * - Validation: -50
 * - Web: 50
 */
export const STORAGE_INIT_ORDER = -90;
export const STORAGE_SHUTDOWN_ORDER = 110;
