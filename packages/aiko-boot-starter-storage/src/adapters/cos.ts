/**
 * 腾讯云 COS 存储适配器
 *
 * 依赖（peer）：cos-nodejs-sdk-v5
 */
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { StorageError, type IStorageAdapter, type ImagePreviewOptions, type UploadOptions, type UploadResult } from '../types.js';
import { buildKey, getMimeType } from './utils.js';

export interface CosStorageConfig {
  /** 存储桶名称，格式：{BucketName}-{AppId}，如 'my-bucket-1250000000' */
  bucket: string;
  /** 区域，如 'ap-guangzhou' */
  region: string;
  /** Secret ID */
  secretId: string;
  /** Secret Key */
  secretKey: string;
  /** 自定义域名（CDN 加速地址） */
  customDomain?: string;
}

export class CosStorageAdapter implements IStorageAdapter {
  private readonly config: CosStorageConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  constructor(config: CosStorageConfig) {
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getClient(): Promise<any> {
    if (this.client) return this.client;
    let COS;
    try {
      const mod = await import('cos-nodejs-sdk-v5');
      COS = (mod as any).default ?? mod;
    } catch {
      throw new StorageError(
        '腾讯云 COS 适配器需要安装 cos-nodejs-sdk-v5，请执行: pnpm add cos-nodejs-sdk-v5',
        'ADAPTER_NOT_FOUND',
      );
    }
    this.client = new COS({
      SecretId: this.config.secretId,
      SecretKey: this.config.secretKey,
    });
    return this.client;
  }

  async upload(file: Buffer, fileName: string, options: UploadOptions = {}): Promise<UploadResult> {
    const ext = extname(fileName).toLowerCase();
    const key = options.key ?? buildKey(options.folder, randomUUID() + ext);
    const mimeType = options.contentType ?? getMimeType(fileName);
    const client = await this.getClient();

    await new Promise<void>((resolve, reject) => {
      client.putObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
          Body: file,
          ContentType: mimeType,
        },
        (err: unknown) => {
          if (err) reject(new StorageError(`腾讯云 COS 上传失败: ${key}`, 'UPLOAD_FAILED', err));
          else resolve();
        },
      );
    });

    return {
      url: this.getUrl(key),
      key,
      size: file.length,
      mimeType,
      provider: 'cos',
      originalName: fileName,
    };
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    await new Promise<void>((resolve, reject) => {
      client.deleteObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
        },
        (err: unknown) => {
          if (err) reject(new StorageError(`腾讯云 COS 删除失败: ${key}`, 'DELETE_FAILED', err));
          else resolve();
        },
      );
    });
  }

  getUrl(key: string): string {
    if (this.config.customDomain) {
      return `${this.config.customDomain.replace(/\/$/, '')}/${key}`;
    }
    return `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${key}`;
  }

  /**
   * 获取图片预览 URL（腾讯云 COS 数据万象 CI）
   *
   * 利用腾讯云数据万象（CI）的基础图片处理能力，通过在 URL 末尾附加
   * `?imageMogr2/...` 参数，由 CDN 节点实时完成缩放、格式转换、质量压缩。
   *
   * @see https://cloud.tencent.com/document/product/460/6929
   *
   * @example
   * // 缩放到 200×200 WebP，质量 80
   * adapter.getPreviewUrl('products/photo.jpg', { width: 200, height: 200, format: 'webp', quality: 80 })
   * // => https://bucket.cos.ap-guangzhou.myqcloud.com/products/photo.jpg?imageMogr2/thumbnail/200x200/quality/80/format/webp
   */
  getPreviewUrl(key: string, options?: ImagePreviewOptions): string {
    const baseUrl = this.getUrl(key);
    if (!options) return baseUrl;

    const parts: string[] = ['imageMogr2'];

    if (options.width || options.height) {
      const w = options.width ?? '';
      const h = options.height ?? '';
      if (options.fit === 'cover') {
        parts.push(`thumbnail/${w}x${h}!`);
      } else if (options.fit === 'fill') {
        parts.push(`thumbnail/${w}x${h}!`);
        parts.push('ignore-error/1');
      } else {
        parts.push(`thumbnail/${w}x${h}`);
      }
    }

    if (options.quality) {
      parts.push(`quality/${options.quality}`);
    }

    if (options.format) {
      parts.push(`format/${options.format}`);
    }

    if (parts.length === 1) return baseUrl;
    return `${baseUrl}?${parts.join('/')}`;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const client = await this.getClient();
    return new Promise((resolve, reject) => {
      client.getObjectUrl(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
          Expires: expiresIn,
          Sign: true,
        },
        (err: unknown, data: { Url: string }) => {
          if (err) reject(new StorageError(`腾讯云 COS 获取签名 URL 失败: ${key}`, 'UPLOAD_FAILED', err));
          else resolve(data.Url);
        },
      );
    });
  }
}
