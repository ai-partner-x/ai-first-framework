# aiko-boot-starter-storage

文件存储 Starter，提供统一的文件上传/删除/URL 生成接口，支持本地磁盘、AWS S3（及兼容服务）、阿里云 OSS、腾讯云 COS 四种存储后端，通过配置文件一键切换，业务代码零修改。

## 功能特性

- **多存储后端**：Local / S3（MinIO、Cloudflare R2）/ OSS / COS，统一 API 调用
- **自动配置**：引入包后按 `storage.*` 配置自动初始化，无需手动 `new`
- **文件校验**：大小限制、MIME 类型白名单、magic byte 内容检测（防伪造扩展名）
- **图片预览**：OSS / COS 支持云端图片缩放/格式转换/质量压缩 URL（`getPreviewUrl`）
- **预签名 URL**：S3 / OSS / COS 支持私有文件临时访问链接（`getSignedUrl`）
- **装饰器支持**：`@Uploadable`、`@StorageField` 可在实体类上声明上传策略元数据

---

## 安装

```bash
pnpm add @ai-partner-x/aiko-boot-starter-storage
```

如需使用云存储，还需安装对应的 peer 依赖：

| Provider | 额外依赖 |
|----------|---------|
| AWS S3 / MinIO / R2 | `@aws-sdk/client-s3` `@aws-sdk/s3-request-presigner` |
| 阿里云 OSS | `ali-oss` |
| 腾讯云 COS | `cos-nodejs-sdk-v5` |

---

## 快速开始

### 1. 配置文件

在 `app.config.ts` 中添加 `storage` 配置块：

```typescript
// app.config.ts
import type { AppConfig } from '@ai-partner-x/aiko-boot';

export default {
  storage: {
    provider: 'local',
    local: {
      uploadDir: './uploads',
      baseUrl: 'http://localhost:3001/uploads',
    },
  },
} satisfies AppConfig;
```

### 2. 在 Controller 中注入使用

```typescript
import { RestController, PostMapping } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { StorageService } from '@ai-partner-x/aiko-boot-starter-storage';
import type { Request } from 'express';

@RestController({ path: '/upload' })
export class UploadController {
  @Autowired()
  private storageService!: StorageService;

  @PostMapping('/')
  async upload(req: Request) {
    const file = (req as any).file as Express.Multer.File;
    const result = await this.storageService.upload(file.buffer, file.originalname, {
      folder: 'images',
      maxSize: 10 * 1024 * 1024,          // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    return result;
    // { url, key, size, mimeType, provider, originalName }
  }
}
```

---

## 配置说明

### 本地存储（provider: 'local'）

```typescript
storage: {
  provider: 'local',
  local: {
    uploadDir: './uploads',                    // 文件存储目录（相对或绝对路径）
    baseUrl: 'http://localhost:3001/uploads',  // 公开访问的 Base URL
  },
},
```

### AWS S3 / MinIO / Cloudflare R2（provider: 's3'）

```typescript
storage: {
  provider: 's3',
  s3: {
    bucket: 'my-bucket',
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // MinIO / R2 等兼容服务需要额外填写：
    endpoint: 'http://localhost:9000',   // 可选，兼容服务的自定义 Endpoint
    forcePathStyle: true,                // MinIO 需要开启
    cdnBaseUrl: 'https://cdn.example.com', // 可选，CDN 加速地址
    aclEnabled: true,                    // Bucket 是否允许 ACL，默认 true
  },
},
```

### 阿里云 OSS（provider: 'oss'）

```typescript
storage: {
  provider: 'oss',
  oss: {
    bucket: 'my-bucket',
    region: 'oss-cn-hangzhou',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    customDomain: 'https://cdn.example.com', // 可选，自定义域名
    secure: true,                            // 可选，是否使用 HTTPS，默认 true
  },
},
```

### 腾讯云 COS（provider: 'cos'）

```typescript
storage: {
  provider: 'cos',
  cos: {
    bucket: 'my-bucket-1250000000',
    region: 'ap-guangzhou',
    secretId: process.env.COS_SECRET_ID,
    secretKey: process.env.COS_SECRET_KEY,
    customDomain: 'https://cdn.example.com', // 可选，自定义域名
  },
},
```

---

## StorageService API

通过 `@Autowired()` 注入 `StorageService`，调用以下方法：

### `upload(file, fileName, options?)`

上传文件，自动进行大小和 MIME 类型校验。

```typescript
const result = await storageService.upload(buffer, 'photo.jpg', {
  folder: 'avatars',             // 存储目录，最终 key 为 avatars/{uuid}.jpg
  key: 'avatars/custom.jpg',     // 可选，自定义完整 key（设置后 folder 无效）
  maxSize: 5 * 1024 * 1024,      // 最大文件大小，默认 5MB
  allowedTypes: ['image/jpeg', 'image/png'], // MIME 白名单，默认支持常见图片格式
  acl: 'public-read',            // 可选，访问控制（仅在支持 ACL 的存储有效）
});

// 返回值 UploadResult：
// {
//   url: 'http://localhost:3001/uploads/avatars/xxx.jpg',  公开访问 URL
//   key: 'avatars/xxx.jpg',      存储 key（用于删除、获取 URL）
//   size: 1024,                  文件大小（字节）
//   mimeType: 'image/jpeg',      MIME 类型
//   provider: 'local',           使用的存储后端
//   originalName: 'photo.jpg',   原始文件名
// }
```

### `delete(key)`

删除文件。

```typescript
await storageService.delete('avatars/xxx.jpg');
```

### `getUrl(key)`

获取文件公开访问 URL。

```typescript
const url = await storageService.getUrl('avatars/xxx.jpg');
```

### `getPreviewUrl(key, options?)`

获取图片预览 URL，OSS / COS 会附加云端图片处理参数，本地存储返回原图 URL。

```typescript
const url = await storageService.getPreviewUrl('products/photo.jpg', {
  width: 200,
  height: 200,
  format: 'webp',
  quality: 80,
  fit: 'cover',  // 'contain' | 'cover' | 'fill'，仅 OSS / COS 支持
});
```

### `getSignedUrl(key, expiresIn?)`

获取私有文件的预签名临时访问 URL（S3 / OSS / COS 支持，本地存储不支持）。

```typescript
const url = await storageService.getSignedUrl('private/doc.pdf', 3600); // 1 小时后过期
```

---

## 装饰器

### `@Uploadable`

类装饰器，在类上声明上传策略元数据。

```typescript
import { Uploadable } from '@ai-partner-x/aiko-boot-starter-storage';

@Uploadable({
  folder: 'products',
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
})
export class ProductImageUploader {}
```

### `@StorageField`

属性装饰器，在实体类字段上声明该字段存储的是上传文件的 URL，并附带上传策略元数据。

```typescript
import { StorageField } from '@ai-partner-x/aiko-boot-starter-storage';

export class Product {
  @StorageField({ folder: 'products', allowedTypes: ['image/jpeg', 'image/png'] })
  imageUrl!: string;
}
```

---

## 错误处理

上传/删除失败时抛出 `StorageError`，可通过 `code` 字段区分错误类型：

```typescript
import { StorageError } from '@ai-partner-x/aiko-boot-starter-storage';

try {
  await storageService.upload(buffer, 'photo.jpg', { maxSize: 1024 });
} catch (err) {
  if (err instanceof StorageError) {
    switch (err.code) {
      case 'FILE_TOO_LARGE': // 文件超出大小限制
      case 'INVALID_TYPE':   // MIME 类型不在白名单，或 magic byte 与扩展名不符
      case 'UPLOAD_FAILED':  // 底层存储写入失败
      case 'DELETE_FAILED':  // 文件删除失败
      case 'CONFIG_MISSING': // 存储未初始化
    }
  }
}
```

---

## 完整示例

参考 `scaffold/examples/storage-upload`，包含基于 aiko-boot 的完整文件上传 API 服务：

```
scaffold/examples/storage-upload/
├── app.config.ts          # 存储配置（provider、uploadDir、upload 策略）
└── src/
    ├── server.ts           # 应用入口，挂载 multer 中间件
    └── controller/
        └── upload.controller.ts  # 单/多文件上传、删除、URL 获取接口
```

启动方式：

```bash
cd scaffold/examples/storage-upload
pnpm dev
```

接口列表：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 单文件上传（form-data: `file`, `folder?`） |
| POST | `/api/upload/multiple` | 多文件上传（form-data: `files[]`, `folder?`） |
| DELETE | `/api/upload?key=...` | 删除文件 |
| GET | `/api/upload/url?key=...` | 获取文件 URL |
| GET | `/api/upload/preview?key=...` | 获取图片预览 URL |
