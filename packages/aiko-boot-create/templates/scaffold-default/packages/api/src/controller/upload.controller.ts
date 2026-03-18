import 'reflect-metadata';
import { RestController, PostMapping, DeleteMapping, GetMapping, RequestParam, RequestPart, MultipartFile } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { StorageService, type UploadResult } from '@ai-partner-x/aiko-boot-starter-storage';

/**
 * 文件上传控制器
 *
 * 提供文件上传、删除、获取 URL 等接口
 */
@RestController({ path: '/upload' })
export class UploadController {
  @Autowired(StorageService)
  private storageService!: StorageService;

  /**
   * 上传单个文件
   *
   * @example
   * curl -X POST http://localhost:3001/api/upload \
   *   -F "file=@/path/to/image.png" \
   *   -F "folder=images"
   */
  @PostMapping('/')
  async upload(
    @RequestPart('file') file: MultipartFile | undefined,
    @RequestPart('folder') folder?: string,
  ): Promise<UploadResult> {
    if (!file || file.isEmpty()) {
      throw new Error('上传的文件为空或未提供');
    }
    return this.storageService.upload(file.getBytes(), file.getOriginalFilename(), {
      folder: folder || 'uploads',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });
  }

  /**
   * 删除文件
   *
   * @example
   * curl -X DELETE "http://localhost:3001/api/upload?key=images/xxx.png"
   */
  @DeleteMapping('/')
  async delete(@RequestParam('key') key: string): Promise<{ success: boolean }> {
    await this.storageService.delete(key);
    return { success: true };
  }

  /**
   * 获取文件 URL
   *
   * @example
   * curl "http://localhost:3001/api/upload/url?key=images/xxx.png"
   */
  @GetMapping('/url')
  async getUrl(@RequestParam('key') key: string): Promise<{ url: string }> {
    const url = await this.storageService.getUrl(key);
    return { url };
  }

  /**
   * 获取图片预览 URL（支持 OSS/COS 的图片处理参数）
   *
   * @example
   * curl "http://localhost:3001/api/upload/preview?key=images/xxx.png&width=200&height=200"
   */
  @GetMapping('/preview')
  async getPreviewUrl(
    @RequestParam('key') key: string,
    @RequestParam('width') width?: string,
    @RequestParam('height') height?: string,
    @RequestParam('quality') quality?: string,
  ): Promise<{ url: string }> {
    const url = await this.storageService.getPreviewUrl(key, {
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
      quality: quality ? parseInt(quality, 10) : undefined,
    });
    return { url };
  }
}
