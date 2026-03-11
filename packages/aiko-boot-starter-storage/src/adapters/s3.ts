/**
 * AWS S3 / MinIO / Cloudflare R2 兼容存储适配器
 *
 * 依赖（peer）：
 *   @aws-sdk/client-s3
 *   @aws-sdk/s3-request-presigner
 */
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { StorageError, type IStorageAdapter, type ImagePreviewOptions, type UploadOptions, type UploadResult } from '../types.js';
import { buildKey, getMimeType } from './utils.js';

export interface S3StorageConfig {
  /** 存储桶名称 */
  bucket: string;
  /** 区域，如 'us-east-1' */
  region: string;
  /** Access Key ID */
  accessKeyId: string;
  /** Secret Access Key */
  secretAccessKey: string;
  /**
   * 自定义 Endpoint（MinIO / R2 等兼容服务必填）
   * @example 'http://localhost:9000'
   */
  endpoint?: string;
  /**
   * 是否强制使用路径风格访问（MinIO 需要开启）
   * @default false
   */
  forcePathStyle?: boolean;
  /** 自定义公开 Base URL（CDN 加速地址） */
  cdnBaseUrl?: string;
  /**
   * Bucket 是否允许对象 ACL
   *
   * 某些 Bucket（Bucket owner enforced）会禁用 ACL，此时若上传时传入 acl=public-read 会失败。
   * 若你的 Bucket 禁用了 ACL，请显式设置为 false，并改用 Bucket Policy 控制公开访问。
   * @default true
   */
  aclEnabled?: boolean;
}

export class S3StorageAdapter implements IStorageAdapter {
  private readonly config: S3StorageConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  constructor(config: S3StorageConfig) {
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getClient(): Promise<any> {
    if (this.client) return this.client;
    let S3ClientClass;
    try {
      const mod = await import('@aws-sdk/client-s3');
      S3ClientClass = mod.S3Client;
    } catch {
      throw new StorageError(
        'S3 适配器需要安装 @aws-sdk/client-s3，请执行: pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
        'ADAPTER_NOT_FOUND',
      );
    }
    this.client = new S3ClientClass({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      ...(this.config.endpoint ? { endpoint: this.config.endpoint } : {}),
      ...(this.config.forcePathStyle ? { forcePathStyle: true } : {}),
    });
    return this.client;
  }

  async upload(file: Buffer, fileName: string, options: UploadOptions = {}): Promise<UploadResult> {
    const ext = extname(fileName).toLowerCase();
    const key = options.key ?? buildKey(options.folder, randomUUID() + ext);
    const mimeType = options.contentType ?? getMimeType(fileName);
    const acl = options.acl;

    if (acl === 'public-read' && this.config.aclEnabled === false) {
      throw new StorageError(
        '当前 S3 配置已禁用 ACL（aclEnabled=false），不能使用 acl=public-read。请改用 Bucket Policy 或移除 acl 参数。',
        'INVALID_CONFIG',
      );
    }

    const client = await this.getClient();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const putObjectParams: any = {
      Bucket: this.config.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    };

    if (acl === 'public-read') {
      putObjectParams.ACL = 'public-read';
    }

    try {
      await client.send(new PutObjectCommand(putObjectParams));
    } catch (err) {
      throw new StorageError(`S3 上传失败: ${key}`, 'UPLOAD_FAILED', err);
    }

    return {
      url: this.getUrl(key),
      key,
      size: file.length,
      mimeType,
      provider: 's3',
      originalName: fileName,
    };
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    try {
      await client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
    } catch (err) {
      throw new StorageError(`S3 删除失败: ${key}`, 'DELETE_FAILED', err);
    }
  }

  getUrl(key: string): string {
    if (this.config.cdnBaseUrl) {
      return `${this.config.cdnBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    if (this.config.endpoint) {
      return `${this.config.endpoint.replace(/\/$/, '')}/${this.config.bucket}/${key}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * 获取图片预览 URL
   *
   * S3 原生不支持 URL 图片处理。
   * - 配置了 `cdnBaseUrl`（如 CloudFront）时，可通过 CDN 的 Image Optimization 功能
   *   将 width / height / quality / format 作为 query 参数传递给 CDN Edge Function。
   * - 未配置 cdnBaseUrl 时，忽略 options，返回原图 URL。
   */
  getPreviewUrl(key: string, options?: ImagePreviewOptions): string {
    const baseUrl = this.getUrl(key);
    if (!this.config.cdnBaseUrl || !options) return baseUrl;

    const params = new URLSearchParams();
    if (options.width) params.set('width', String(options.width));
    if (options.height) params.set('height', String(options.height));
    if (options.quality) params.set('quality', String(options.quality));
    if (options.format) params.set('format', options.format);
    if (options.fit) params.set('fit', options.fit);

    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    let presignerGetSignedUrl;
    try {
      const mod = await import('@aws-sdk/s3-request-presigner');
      presignerGetSignedUrl = mod.getSignedUrl;
    } catch {
      throw new StorageError(
        '生成签名 URL 需要安装 @aws-sdk/s3-request-presigner，请执行: pnpm add @aws-sdk/s3-request-presigner',
        'ADAPTER_NOT_FOUND',
      );
    }
    const client = await this.getClient();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    return presignerGetSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      { expiresIn },
    );
  }
}
