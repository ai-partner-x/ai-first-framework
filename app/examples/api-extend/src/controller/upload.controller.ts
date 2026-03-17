/**
 * UploadController - 演示 @RequestPart 和 MultipartFile 装饰器
 * 集成 aiko-boot-starter-storage 实现文件持久化存储
 *
 * Spring Boot 风格的文件上传：
 *   - @RequestPart('fieldName') file: MultipartFile  →  接收 multipart/form-data 中的文件
 *   - MultipartFile 接口方法：getName / getOriginalFilename / getContentType / getSize / getBytes
 *   - 框架自动为含 @RequestPart 的路由注入 multer memoryStorage 中间件
 *   - 使用 StorageService 将文件上传到本地/S3/OSS/COS 存储
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  POST  /api/upload/single   上传单个文件                  │
 * │  POST  /api/upload/avatar   上传头像（自定义 field 名）    │
 * │  POST  /api/upload/multi    同时上传两个文件               │
 * └──────────────────────────────────────────────────────────┘
 */
import 'reflect-metadata';
import {
  RestController,
  PostMapping,
  RequestPart,
  type MultipartFile,
} from '@ai-partner-x/aiko-boot-starter-web';
import { StorageService, type UploadOptions, type UploadResult } from '@ai-partner-x/aiko-boot-starter-storage';
import { Autowired } from '@ai-partner-x/aiko-boot';

@RestController({ path: '/upload' })
export class UploadController {
  @Autowired()
  storageService!: StorageService;

  private buildUploadOptions(file: MultipartFile, options?: UploadOptions): UploadOptions {
    return {
      folder: options?.folder ?? 'uploads',
      maxSize: options?.maxSize ?? 10 * 1024 * 1024,
      allowedTypes: options?.allowedTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      ...options,
    };
  }

  /**
   * POST /api/upload/single
   *
   * 接收 form-data 字段 "file"，上传到配置的存储服务。
   *
   * curl -X POST http://localhost:3003/api/upload/single \
   *   -F "file=@/path/to/photo.png"
   */
  @PostMapping('/single')
  async uploadSingle(
    @RequestPart('file') file: MultipartFile,
  ): Promise<object> {
    if (!file || file.isEmpty()) {
      throw new Error('No file uploaded');
    }

    const buffer = file.getBytes();
    const options = this.buildUploadOptions(file, { folder: 'single' });

    const result = await this.storageService.upload(buffer, file.getOriginalFilename(), options);

    return {
      ...result,
      message: '✅ File uploaded to storage service',
    };
  }

  /**
   * POST /api/upload/avatar
   *
   * 接收 form-data 字段 "avatar"，演示自定义 part 名称。
   *
   * curl -X POST http://localhost:3003/api/upload/avatar \
   *   -F "avatar=@/path/to/avatar.jpg"
   */
  @PostMapping('/avatar')
  async uploadAvatar(
    @RequestPart('avatar') avatar: MultipartFile,
  ): Promise<object> {
    if (!avatar || avatar.isEmpty()) {
      throw new Error('No avatar uploaded');
    }

    const buffer = avatar.getBytes();
    const options = this.buildUploadOptions(avatar, { 
      folder: 'avatars',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    const result = await this.storageService.upload(buffer, avatar.getOriginalFilename(), options);

    return {
      fieldName: avatar.getName(),
      originalFilename: avatar.getOriginalFilename(),
      sizeBytes: avatar.getSize(),
      url: result.url,
      key: result.key,
      message: '✅ Avatar uploaded to storage service',
    };
  }

  /**
   * POST /api/upload/multi
   *
   * 同时接收两个文件 "document" 和 "thumbnail"，
   * 演示多个 @RequestPart 参数共存。
   *
   * curl -X POST http://localhost:3003/api/upload/multi \
   *   -F "document=@/path/to/doc.pdf" \
   *   -F "thumbnail=@/path/to/thumb.png"
   */
  @PostMapping('/multi')
  async uploadMulti(
    @RequestPart('document') document: MultipartFile,
    @RequestPart('thumbnail') thumbnail: MultipartFile,
  ): Promise<object> {
    const results: Record<string, object> = {};
    
    if (document && !document.isEmpty()) {
      const buffer = document.getBytes();
      const docOptions = this.buildUploadOptions(document, { 
        folder: 'documents',
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      });
      const docResult = await this.storageService.upload(buffer, document.getOriginalFilename(), docOptions);
      
      results.document = {
        originalFilename: document.getOriginalFilename(),
        sizeBytes: document.getSize(),
        url: docResult.url,
        key: docResult.key,
      };
    }
    
    if (thumbnail && !thumbnail.isEmpty()) {
      const buffer = thumbnail.getBytes();
      const thumbOptions = this.buildUploadOptions(thumbnail, { 
        folder: 'thumbnails',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      const thumbResult = await this.storageService.upload(buffer, thumbnail.getOriginalFilename(), thumbOptions);
      
      results.thumbnail = {
        originalFilename: thumbnail.getOriginalFilename(),
        sizeBytes: thumbnail.getSize(),
        url: thumbResult.url,
        key: thumbResult.key,
      };
    }
    
    return {
      uploaded: Object.keys(results),
      files: results,
      message: '✅ Multiple files uploaded to storage service',
    };
  }
}
