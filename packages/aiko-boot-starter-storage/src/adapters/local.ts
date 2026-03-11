/**
 * 本地磁盘存储适配器
 *
 * 将文件写入服务器本地文件系统，适合开发环境和小型项目
 */
import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { dirname, extname, resolve } from 'path';
import { StorageError, type IStorageAdapter, type ImagePreviewOptions, type UploadOptions, type UploadResult } from '../types.js';
import { buildKey, getMimeType } from './utils.js';

export interface LocalStorageConfig {
  /** 文件上传目录（绝对路径），如 '/var/uploads' */
  uploadDir: string;
  /** 公开访问的 Base URL，如 'http://localhost:3000/uploads' */
  baseUrl: string;
}

export class LocalStorageAdapter implements IStorageAdapter {
  private readonly uploadRoot: string;
  private readonly baseUrl: string;

  constructor(config: LocalStorageConfig) {
    this.uploadRoot = resolve(config.uploadDir);
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  private normalizeKey(rawKey: string): string {
    const key = rawKey.replace(/\\/g, '/').replace(/^\/+/, '');
    const segments = key.split('/');
    if (!key || key.includes('\0') || segments.some((s) => s === '' || s === '.' || s === '..')) {
      throw new StorageError(`非法文件 key: ${rawKey}`, 'UPLOAD_FAILED');
    }
    return segments.join('/');
  }

  private resolveSafePath(key: string): string {
    const safePath = resolve(this.uploadRoot, key);
    if (safePath !== this.uploadRoot && !safePath.startsWith(this.uploadRoot + '/')) {
      throw new StorageError(`非法文件路径: ${key}`, 'UPLOAD_FAILED');
    }
    return safePath;
  }

  async upload(file: Buffer, fileName: string, options: UploadOptions = {}): Promise<UploadResult> {
    const ext = extname(fileName).toLowerCase();
    const rawKey = options.key ?? buildKey(options.folder, randomUUID() + ext);
    const key = this.normalizeKey(rawKey);
    const mimeType = options.contentType ?? getMimeType(fileName);
    const filePath = this.resolveSafePath(key);

    await mkdir(dirname(filePath), { recursive: true });
    try {
      await writeFile(filePath, file);
    } catch (err) {
      throw new StorageError(`文件写入失败: ${filePath}`, 'UPLOAD_FAILED', err);
    }

    return {
      url: this.getUrl(key),
      key,
      size: file.length,
      mimeType,
      provider: 'local',
      originalName: fileName,
    };
  }

  async delete(key: string): Promise<void> {
    const safeKey = this.normalizeKey(key);
    const filePath = this.resolveSafePath(safeKey);
    try {
      await unlink(filePath);
    } catch (err) {
      throw new StorageError(`文件删除失败: ${filePath}`, 'DELETE_FAILED', err);
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  /**
   * 获取图片预览 URL
   *
   * 本地存储不支持服务端图片处理，直接返回原图 URL。
   * 如需缩略图，请在 Web 层使用 CSS / canvas 或自行集成 sharp。
   */
  getPreviewUrl(key: string, _options?: ImagePreviewOptions): string {
    return this.getUrl(key);
  }
}
