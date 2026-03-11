/**
 * @ai-partner-x/aiko-boot-starter-storage
 *
 * Spring Boot Style Storage Starter with multi-provider support
 *
 * Features:
 * - Auto-configuration based on storage.* config
 * - Multi-provider support: Local disk, AWS S3 / MinIO / R2, Aliyun OSS, Tencent COS
 * - File validation: size limit, MIME type allowlist, magic byte detection
 * - StorageService with full upload/delete/url/signed-url API
 * - @Uploadable / @StorageField decorators for entity integration
 */

// Core types
export {
  StorageError,
  type StorageProvider,
  type UploadOptions,
  type UploadResult,
  type IStorageAdapter,
  type ImagePreviewOptions,
} from './types.js';

// Config management
export {
  setStorageConfig,
  getStorageConfig,
  createAdapterFromConfig,
  isStorageInitialized,
  resetStorageConfig,
  type StorageConfig,
  type LocalStorageConfig,
  type S3StorageConfig,
  type OssStorageConfig,
  type CosStorageConfig,
} from './config.js';

// Decorators
export {
  Uploadable,
  StorageField,
  getUploadableMetadata,
  getStorageFieldMetadata,
  UPLOADABLE_METADATA,
  STORAGE_FIELD_METADATA,
  type UploadableOptions,
  type StorageFieldOptions,
} from './decorators.js';

// StorageService
export { StorageService } from './storage-service.js';

// Adapters
export {
  LocalStorageAdapter,
  S3StorageAdapter,
  OssStorageAdapter,
  CosStorageAdapter,
  getMimeType,
  detectMimeTypeFromBuffer,
  buildKey,
  isMimeTypeAllowed,
} from './adapters/index.js';

// Auto Configuration
export {
  StorageAutoConfiguration,
  StorageProperties,
} from './auto-configuration.js';

export {
  STORAGE_INIT_ORDER,
  STORAGE_SHUTDOWN_ORDER,
} from './lifecycle-order.js';

// Config Augmentation (扩展 @ai-partner-x/aiko-boot 的 AppConfig)
import './config-augment.js';
