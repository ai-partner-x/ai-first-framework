import 'reflect-metadata';
import { RestController, PostMapping, DeleteMapping, GetMapping, RequestParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { ConfigLoader } from '@ai-partner-x/aiko-boot/boot';
import { StorageService, type UploadResult } from '@ai-partner-x/aiko-boot-starter-storage';
import type { Request, Response } from 'express';

/**
 * 文件上传控制器
 *
 * 提供文件上传、删除、获取 URL 及图片预览等接口。
 * 上传策略（allowedTypes、maxSize）读自 app.config.ts 的 upload.* 配置块。
 */
@RestController({ path: '/upload' })
export class UploadController {
  @Autowired()
  private storageService!: StorageService;

  /**
   * 从配置中读取允许的 MIME 类型列表
   * 默认已在 app.config.ts 的 upload.allowedTypes 配置
   */
  private getAllowedTypes(): string[] {
    return ConfigLoader.get<string[]>('upload.allowedTypes', [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]);
  }

  /**
   * 从配置中读取单个文件最大大小（字节）
   * 默认已在 app.config.ts 的 upload.maxSize 配置
   */
  private getMaxSize(): number {
    return ConfigLoader.get<number>('upload.maxSize', 10 * 1024 * 1024); // 默认 10MB
  }

  /**
   * 校验 folder 参数，防止路径遍历攻击（如 ../../etc/passwd）。
   * 只允许字母、数字、连字符、下划线和单个斜杠分隔的目录名。
   */
  private validateFolder(folder: string): void {
    if (!/^[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*$/.test(folder)) {
      throw new Error(`Invalid folder name: "${folder}". Only alphanumeric characters, hyphens, underscores and forward slashes are allowed.`);
    }
  }

  /**
   * 上传单个文件
   *
   * @example
   * curl -X POST http://localhost:3003/api/upload \
   *   -F "file=@/path/to/image.png" \
   *   -F "folder=images"
   */
  @PostMapping('/')
  async upload(req: Request, res: Response): Promise<UploadResult | { error: string }> {
    try {
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        res.status(400);
        return { error: 'No file uploaded' };
      }

      const folder = (req.body?.folder as string) || 'uploads';
      this.validateFolder(folder);

      return await this.storageService.upload(file.buffer, file.originalname, {
        folder,
        maxSize: this.getMaxSize(),
        allowedTypes: this.getAllowedTypes(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(400);
      return { error: message };
    }
  }

  /**
   * 上传多个文件
   *
   * @example
   * curl -X POST http://localhost:3003/api/upload/multiple \
   *   -F "files=@/path/to/image1.png" \
   *   -F "files=@/path/to/image2.png" \
   *   -F "folder=images"
   */
  @PostMapping('/multiple')
  async uploadMultiple(req: Request, res: Response): Promise<UploadResult[] | { error: string }> {
    try {
      const files = (req as Request & { files?: Express.Multer.File[] }).files;
      if (!files || files.length === 0) {
        res.status(400);
        return { error: 'No files uploaded' };
      }

      const folder = (req.body?.folder as string) || 'uploads';
      this.validateFolder(folder);

      return await Promise.all(
        files.map((file) =>
          this.storageService.upload(file.buffer, file.originalname, {
            folder,
            maxSize: this.getMaxSize(),
            allowedTypes: this.getAllowedTypes(),
          }),
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(400);
      return { error: message };
    }
  }

  /**
   * 删除文件
   *
   * @example
   * curl -X DELETE "http://localhost:3003/api/upload?key=images/xxx.png"
   */
  @DeleteMapping('/')
  async delete(@RequestParam('key') key: string, res: Response): Promise<{ success: boolean } | { error: string }> {
    try {
      await this.storageService.delete(key);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      res.status(500);
      return { error: message };
    }
  }

  /**
   * 获取文件 URL
   *
   * @example
   * curl "http://localhost:3003/api/upload/url?key=images/xxx.png"
   */
  @GetMapping('/url')
  async getUrl(@RequestParam('key') key: string, res: Response): Promise<{ url: string } | { error: string }> {
    try {
      const url = await this.storageService.getUrl(key);
      return { url };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get URL';
      res.status(500);
      return { error: message };
    }
  }

  /**
   * 获取图片预览 URL（支持 OSS/COS 的图片处理参数）
   *
   * @example
   * curl "http://localhost:3003/api/upload/preview?key=images/xxx.png&width=200&height=200"
   */
  @GetMapping('/preview')
  async getPreviewUrl(
    @RequestParam('key') key: string,
    res: Response,
    @RequestParam('width') width?: string,
    @RequestParam('height') height?: string,
    @RequestParam('quality') quality?: string,
  ): Promise<{ url: string } | { error: string }> {
    try {
      const url = await this.storageService.getPreviewUrl(key, {
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
        quality: quality ? parseInt(quality, 10) : undefined,
      });
      return { url };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get preview URL';
      res.status(500);
      return { error: message };
    }
  }
}
