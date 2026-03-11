/**
 * @ai-partner-x/aiko-boot-starter-storage
 * StorageService - 核心存储服务
 *
 * 使用 @Service 装饰器注册到 DI 容器，对齐 aiko-boot 风格。
 * 支持文件大小校验、MIME 类型白名单校验、多适配器切换。
 */
import 'reflect-metadata';
import { Service } from '@ai-partner-x/aiko-boot';
import { StorageError, type IStorageAdapter, type ImagePreviewOptions, type UploadOptions, type UploadResult } from './types.js';
import { getMimeType, detectMimeTypeFromBuffer, isMimeTypeAllowed } from './adapters/utils.js';
import { createAdapterFromConfig, isStorageInitialized } from './config.js';

const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const MIME_ALIAS_MAP: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
};

function normalizeMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  return MIME_ALIAS_MAP[normalized] ?? normalized;
}

function isMimeTypeConsistent(detectedMimeType: string, extensionMimeType: string): boolean {
  return normalizeMimeType(detectedMimeType) === normalizeMimeType(extensionMimeType);
}

/**
 * 存储服务
 *
 * @example
 * // 1. 初始化配置（应用启动时执行一次）
 * setStorageConfig({
 *   provider: 'local',
 *   local: { uploadDir: '/var/uploads', baseUrl: 'http://localhost:3000/uploads' },
 * });
 *
 * // 2. 通过 DI 容器获取 StorageService
 * const storageService = container.resolve(StorageService);
 *
 * // 3. 上传文件
 * const result = await storageService.upload(fileBuffer, 'photo.jpg', {
 *   folder: 'avatars',
 *   maxSize: 2 * 1024 * 1024,
 *   allowedTypes: ['image/jpeg', 'image/png'],
 * });
 * console.log(result.url); // https://...
 */
@Service()
export class StorageService {
  private adapter: IStorageAdapter | null = null;

  /**
   * 手动设置存储适配器（优先于全局配置）
   * 通常由自动注入机制调用，也可手动调用覆盖
   */
  setAdapter(adapter: IStorageAdapter): void {
    this.adapter = adapter;
  }

  /**
   * 获取当前适配器（懒加载：首次调用时从全局配置自动创建）
   */
  private async getAdapter(): Promise<IStorageAdapter> {
    if (this.adapter) return this.adapter;
    if (!isStorageInitialized()) {
      throw new StorageError(
        '存储服务未初始化，请先调用 setStorageConfig() 或手动调用 setAdapter()',
        'CONFIG_MISSING',
      );
    }
    this.adapter = await createAdapterFromConfig();
    return this.adapter;
  }

  /**
   * 上传文件
   *
   * 会自动校验文件大小和 MIME 类型，通过后交给底层适配器处理。
   *
   * @param file 文件 Buffer
   * @param fileName 原始文件名（用于推断 MIME 类型和生成存储 key 扩展名）
   * @param options 上传选项（folder、maxSize、allowedTypes 等）
   * @throws StorageError FILE_TOO_LARGE | INVALID_TYPE | UPLOAD_FAILED
   */
  async upload(file: Buffer, fileName: string, options: UploadOptions = {}): Promise<UploadResult> {
    const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED_TYPES;

    if (file.length > maxSize) {
      throw new StorageError(
        `文件大小 ${(file.length / 1024 / 1024).toFixed(2)}MB 超出限制 ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
        'FILE_TOO_LARGE',
      );
    }

    const extensionMimeType = getMimeType(fileName);
    const detectedMimeType = detectMimeTypeFromBuffer(file);
    const mimeType = detectedMimeType ?? extensionMimeType;

    if (
      detectedMimeType &&
      extensionMimeType !== 'application/octet-stream' &&
      !isMimeTypeConsistent(detectedMimeType, extensionMimeType)
    ) {
      throw new StorageError(
        `文件内容类型 ${detectedMimeType} 与扩展名类型 ${extensionMimeType} 不匹配`,
        'INVALID_TYPE',
      );
    }

    if (!isMimeTypeAllowed(mimeType, allowedTypes)) {
      throw new StorageError(
        `文件类型 ${mimeType} 不在允许的类型列表中: ${allowedTypes.join(', ')}`,
        'INVALID_TYPE',
      );
    }

    const adapter = await this.getAdapter();
    return adapter.upload(file, fileName, { ...options, contentType: mimeType });
  }

  /**
   * 删除文件
   *
   * @param key 上传时返回的存储 key
   * @throws StorageError DELETE_FAILED
   */
  async delete(key: string): Promise<void> {
    const adapter = await this.getAdapter();
    return adapter.delete(key);
  }

  /**
   * 获取文件公开访问 URL
   *
   * @param key 存储 key
   */
  async getUrl(key: string): Promise<string> {
    const adapter = await this.getAdapter();
    return adapter.getUrl(key);
  }

  /**
   * 获取图片预览 URL
   *
   * 对于支持服务端图片处理的云存储（OSS / COS），可传入 options 实现缩放、
   * 格式转换、质量压缩，由云厂商 CDN 节点实时处理，**无需下载原图**。
   *
   * 对于本地存储和 S3（无 cdnBaseUrl），忽略 options 返回原图 URL。
   *
   * @param key 存储 key
   * @param options 图片处理参数（宽、高、质量、格式、缩放模式）
   *
   * @example
   * // 生成 200×200 WebP 缩略图预览 URL（OSS / COS 会附加处理参数）
   * const url = await storageService.getPreviewUrl('products/photo.jpg', {
   *   width: 200,
   *   height: 200,
   *   format: 'webp',
   *   quality: 80,
   *   fit: 'cover',
   * });
   */
  async getPreviewUrl(key: string, options?: ImagePreviewOptions): Promise<string> {
    const adapter = await this.getAdapter();
    return adapter.getPreviewUrl(key, options);
  }

  /**
   * 获取文件预签名临时访问 URL（适合私有文件）
   *
   * @param key 存储 key
   * @param expiresIn 过期时间（秒），默认 3600
   * @throws StorageError 如果底层适配器不支持签名 URL
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const adapter = await this.getAdapter();
    if (!adapter.getSignedUrl) {
      throw new StorageError('当前存储适配器不支持 getSignedUrl', 'ADAPTER_NOT_FOUND');
    }
    return adapter.getSignedUrl(key, expiresIn);
  }
}
