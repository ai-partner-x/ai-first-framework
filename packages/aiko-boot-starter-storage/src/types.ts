/**
 * @ai-partner-x/aiko-boot-starter-storage
 * 核心类型与接口定义
 */

export type StorageProvider = 'local' | 's3' | 'oss' | 'cos';

/**
 * 文件上传选项
 */
export interface UploadOptions {
  /**
   * 存储目录，如 'products/images'
   * 最终 key 为 {folder}/{generatedName}.{ext}
   */
  folder?: string;
  /**
   * 自定义存储 key（完整路径，设置后 folder 无效）
   * 默认：{folder}/{uuid}.{ext}
   */
  key?: string;
  /**
   * 最大文件大小（字节），默认 5MB
   * @default 5 * 1024 * 1024
   */
  maxSize?: number;
  /**
   * 允许的 MIME 类型白名单，支持通配符
   * @example ['image/jpeg', 'image/png', 'image/*']
   * @default ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
   */
  allowedTypes?: string[];
  /**
   * 访问控制权限（仅在底层存储支持 ACL 时生效）
   *
   * 注意：部分 S3 Bucket 在禁用 ACL（Bucket owner enforced）时，
   * 设置 public-read 会导致上传失败。
   */
  acl?: 'public-read' | 'private';
  /**
   * 覆盖上传文件的 MIME 类型。
   *
   * 通常由 StorageService 在内容检测后自动填充，业务侧一般无需手动传入。
   */
  contentType?: string;
}

/**
 * 文件上传成功后的返回结果
 */
export interface UploadResult {
  /** 公开访问 URL */
  url: string;
  /** 存储 key，用于删除和生成签名 URL */
  key: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  mimeType: string;
  /** 使用的存储提供商 */
  provider: StorageProvider;
  /** 原始文件名 */
  originalName: string;
}

/**
 * 图片预览选项
 *
 * 对于支持服务端图片处理的云存储（OSS / COS），这些参数会被编码进 URL query 参数，
 * 由云厂商在 CDN 节点实时处理，无需额外费用或服务。
 * 对于本地存储和 S3，这些参数会被忽略，直接返回原图 URL。
 */
export interface ImagePreviewOptions {
  /**
   * 目标宽度（px），等比缩放时另一边自动计算
   */
  width?: number;
  /**
   * 目标高度（px），等比缩放时另一边自动计算
   */
  height?: number;
  /**
   * 图片质量（1-100），仅对 JPEG / WebP 有效
   * @default 85
   */
  quality?: number;
  /**
   * 转换输出格式
   * - 'jpg' / 'png' / 'webp' / 'gif'
   */
  format?: 'jpg' | 'png' | 'webp' | 'gif';
  /**
   * 缩放模式（仅 OSS / COS 支持）
   * - 'contain' 等比缩放，不裁剪，可能留白（默认）
   * - 'cover'   等比缩放并居中裁剪，填满目标尺寸
   * - 'fill'    强制拉伸到目标尺寸，不保持比例
   * @default 'contain'
   */
  fit?: 'contain' | 'cover' | 'fill';
}

/**
 * 存储适配器接口 - 所有存储提供商必须实现此接口
 */
export interface IStorageAdapter {
  /**
   * 上传文件
   * @param file 文件 Buffer
   * @param fileName 原始文件名（用于提取扩展名）
   * @param options 上传选项
   */
  upload(file: Buffer, fileName: string, options?: UploadOptions): Promise<UploadResult>;
  /**
   * 删除文件
   * @param key 存储 key
   */
  delete(key: string): Promise<void>;
  /**
   * 获取文件公开访问 URL
   * @param key 存储 key
   */
  getUrl(key: string): string;
  /**
   * 获取图片预览 URL
   *
   * 支持云端图片处理参数（OSS / COS），可在 URL 层面完成缩放、格式转换、质量压缩。
   * 对于不支持图片处理的适配器（Local / S3 基础版），直接返回 getUrl(key)。
   *
   * @param key 存储 key
   * @param options 图片预览参数（宽、高、质量、格式、缩放模式）
   */
  getPreviewUrl(key: string, options?: ImagePreviewOptions): string;
  /**
   * 获取文件预签名 URL（临时访问链接，适用于私有文件）
   * @param key 存储 key
   * @param expiresIn 过期时间（秒），默认 3600
   */
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

/**
 * 存储操作错误
 */
export class StorageError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'FILE_TOO_LARGE'
      | 'INVALID_TYPE'
      | 'UPLOAD_FAILED'
      | 'DELETE_FAILED'
      | 'CONFIG_MISSING'
      | 'INVALID_CONFIG'
      | 'ADAPTER_NOT_FOUND',
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
