/**
 * UploadController - 演示 @RequestPart 和 MultipartFile 装饰器
 *
 * Spring Boot 风格的文件上传：
 *   - @RequestPart('fieldName') file: MultipartFile  →  接收 multipart/form-data 中的文件
 *   - MultipartFile 接口方法：getName / getOriginalFilename / getContentType / getSize / getBytes / transferTo
 *   - 框架自动为含 @RequestPart 的路由注入 multer memoryStorage 中间件
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

@RestController({ path: '/upload' })
export class UploadController {
  /**
   * POST /api/upload/single
   *
   * 接收 form-data 字段 "file"，返回文件元信息。
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
    return {
      fieldName: file.getName(),
      originalFilename: file.getOriginalFilename(),
      contentType: file.getContentType(),
      sizeBytes: file.getSize(),
      isEmpty: file.isEmpty(),
      message: '✅ File received via @RequestPart',
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
    // 演示 getBytes()：读取二进制内容并显示前 8 字节的 hex
    const bytes = avatar.getBytes();
    const preview = bytes.slice(0, 8).toString('hex');
    return {
      fieldName: avatar.getName(),
      originalFilename: avatar.getOriginalFilename(),
      contentType: avatar.getContentType(),
      sizeBytes: avatar.getSize(),
      first8BytesHex: preview,
      message: '✅ Avatar received. Use getBytes() to read content.',
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
      results.document = {
        originalFilename: document.getOriginalFilename(),
        contentType: document.getContentType(),
        sizeBytes: document.getSize(),
      };
    }
    if (thumbnail && !thumbnail.isEmpty()) {
      results.thumbnail = {
        originalFilename: thumbnail.getOriginalFilename(),
        contentType: thumbnail.getContentType(),
        sizeBytes: thumbnail.getSize(),
      };
    }
    return {
      uploaded: Object.keys(results),
      files: results,
      message: '✅ Multiple files received via @RequestPart',
    };
  }
}
