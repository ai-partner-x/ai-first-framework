/**
 * 阿里云 OSS 存储适配器
 *
 * 依赖（peer）：ali-oss
 */
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { StorageError, type IStorageAdapter, type ImagePreviewOptions, type UploadOptions, type UploadResult } from '../types.js';
import { buildKey, getMimeType } from './utils.js';

export interface OssStorageConfig {
  /** 存储桶名称 */
  bucket: string;
  /** 区域，如 'oss-cn-hangzhou' */
  region: string;
  /** Access Key ID */
  accessKeyId: string;
  /** Access Key Secret */
  accessKeySecret: string;
  /** 自定义域名（CDN 加速地址） */
  customDomain?: string;
  /**
   * 是否使用 HTTPS
   * @default true
   */
  secure?: boolean;
}

export class OssStorageAdapter implements IStorageAdapter {
  private readonly config: OssStorageConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  constructor(config: OssStorageConfig) {
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getClient(): Promise<any> {
    if (this.client) return this.client;
    let OSSClient;
    try {
      const mod = await import('ali-oss');
      OSSClient = (mod as any).default ?? mod;
    } catch {
      throw new StorageError(
        '阿里云 OSS 适配器需要安装 ali-oss，请执行: pnpm add ali-oss',
        'ADAPTER_NOT_FOUND',
      );
    }
    this.client = new OSSClient({
      region: this.config.region,
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
      bucket: this.config.bucket,
      secure: this.config.secure ?? true,
    });
    return this.client;
  }

  async upload(file: Buffer, fileName: string, options: UploadOptions = {}): Promise<UploadResult> {
    const ext = extname(fileName).toLowerCase();
    const key = options.key ?? buildKey(options.folder, randomUUID() + ext);
    const mimeType = options.contentType ?? getMimeType(fileName);
    const client = await this.getClient();

    try {
      await client.put(key, file, { mime: mimeType });
    } catch (err) {
      throw new StorageError(`阿里云 OSS 上传失败: ${key}`, 'UPLOAD_FAILED', err);
    }

    return {
      url: this.getUrl(key),
      key,
      size: file.length,
      mimeType,
      provider: 'oss',
      originalName: fileName,
    };
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.delete(key);
    } catch (err) {
      throw new StorageError(`阿里云 OSS 删除失败: ${key}`, 'DELETE_FAILED', err);
    }
  }

  getUrl(key: string): string {
    if (this.config.customDomain) {
      return `${this.config.customDomain.replace(/\/$/, '')}/${key}`;
    }
    const protocol = (this.config.secure ?? true) ? 'https' : 'http';
    return `${protocol}://${this.config.bucket}.${this.config.region}.aliyuncs.com/${key}`;
  }

  /**
   * 获取图片预览 URL（阿里云 OSS 图片处理）
   *
   * 利用 OSS 内置的图片处理服务（Image Processing），通过在 URL 末尾附加
   * `?x-oss-process=image/...` 参数，由 OSS CDN 节点实时完成缩放、格式转换、质量压缩。
   *
   * @see https://help.aliyun.com/zh/oss/user-guide/img-parameters
   *
   * @example
   * // 缩放到 200×200 WebP，质量 80
   * adapter.getPreviewUrl('products/photo.jpg', { width: 200, height: 200, format: 'webp', quality: 80 })
   * // => https://bucket.oss-cn-hangzhou.aliyuncs.com/products/photo.jpg?x-oss-process=image/resize,m_lfit,w_200,h_200/quality,q_80/format,webp
   */
  getPreviewUrl(key: string, options?: ImagePreviewOptions): string {
    const baseUrl = this.getUrl(key);
    if (!options) return baseUrl;

    const ops: string[] = [];

    if (options.width || options.height) {
      const fitMode = options.fit === 'cover' ? 'm_fill' : options.fit === 'fill' ? 'm_fixed' : 'm_lfit';
      const parts = [fitMode];
      if (options.width) parts.push(`w_${options.width}`);
      if (options.height) parts.push(`h_${options.height}`);
      ops.push(`resize,${parts.join(',')}`);
    }

    if (options.quality) {
      ops.push(`quality,q_${options.quality}`);
    }

    if (options.format) {
      ops.push(`format,${options.format}`);
    }

    if (ops.length === 0) return baseUrl;
    return `${baseUrl}?x-oss-process=image/${ops.join('/')}`;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const client = await this.getClient();
    return client.signatureUrl(key, { expires: expiresIn });
  }
}
