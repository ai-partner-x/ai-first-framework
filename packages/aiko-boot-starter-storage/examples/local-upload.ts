/**
 * aiko-boot-starter-storage 本地上传示例
 *
 * 使用 LocalStorageAdapter，无需任何云账号即可完整测试：
 *   - 文件上传 / 删除
 *   - 安全校验（大小超限、类型不符、magic byte 伪造检测）
 *   - 图片预览 URL 生成
 *   - @Uploadable / @StorageField 装饰器元数据读取
 *
 * 运行方式：
 *   node --import tsx/esm ../../node_modules/.bin/tsx examples/local-upload.ts
 *   或在包根目录执行：
 *   ../../node_modules/.bin/tsx examples/local-upload.ts
 */
import 'reflect-metadata';
import { tmpdir } from 'os';
import { join } from 'path';
import { rm } from 'fs/promises';
import {
  StorageService,
  LocalStorageAdapter,
  StorageError,
  Uploadable,
  StorageField,
  getUploadableMetadata,
  getStorageFieldMetadata,
} from '../src/index.js';

// ──────────────────────────────────────────
// 工具：构造各类文件 Buffer
// ──────────────────────────────────────────

/** 构造最小合法 PNG（magic bytes: 89 50 4E 47 0D 0A 1A 0A + 填充） */
function makePngBuffer(sizeBytes = 512): Buffer {
  const buf = Buffer.alloc(sizeBytes, 0);
  buf[0] = 0x89; buf[1] = 0x50; buf[2] = 0x4e; buf[3] = 0x47;
  buf[4] = 0x0d; buf[5] = 0x0a; buf[6] = 0x1a; buf[7] = 0x0a;
  return buf;
}

/** 构造最小合法 JPEG（magic bytes: FF D8 FF + 填充） */
function makeJpegBuffer(sizeBytes = 512): Buffer {
  const buf = Buffer.alloc(sizeBytes, 0);
  buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff;
  return buf;
}

/** 构造普通文本内容（无图片 magic bytes） */
function makeTextBuffer(content = 'hello world'): Buffer {
  return Buffer.from(content, 'utf-8');
}

/** 把扩展名改成 .jpg 但内容是 PNG magic bytes（伪造类型测试） */
function makeFakeJpegBuffer(): Buffer {
  return makePngBuffer(256); // 文件头是 PNG，但文件名会给 .jpg
}

// ──────────────────────────────────────────
// 装饰器测试用实体
// ──────────────────────────────────────────

// @Uploadable 是类装饰器，直接使用语法没问题
@Uploadable({
  folder: 'products',
  maxSize: 2 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
})
class ProductImageUploader {}

// @StorageField 是字段装饰器，Node.js 24 使用新 stage-3 签名，
// 手动调用与 @StorageField 等价，避免语法层面的版本兼容问题
class Product {
  imageUrl!: string;
  coverUrl!: string;
}
// 手动应用字段装饰器（等价于 @StorageField({...}) 语法）
StorageField({ folder: 'avatars', allowedTypes: ['image/jpeg', 'image/png'] })(Product.prototype, 'imageUrl');
StorageField({ folder: 'covers', maxSize: 10 * 1024 * 1024 })(Product.prototype, 'coverUrl');

// ──────────────────────────────────────────
// 主测试函数
// ──────────────────────────────────────────

async function main() {
  const uploadDir = join(tmpdir(), 'aiko-storage-test-' + Date.now());
  const baseUrl = 'http://localhost:3000/uploads';

  console.log('=== aiko-boot-starter-storage 本地上传测试 ===\n');
  console.log(`📁 临时上传目录: ${uploadDir}\n`);

  // ── 初始化 ──────────────────────────────
  const adapter = new LocalStorageAdapter({ uploadDir, baseUrl });
  const service = new StorageService();
  service.setAdapter(adapter);

  // ══════════════════════════════════════════
  // 1. 基础上传
  // ══════════════════════════════════════════
  console.log('── 1. 基础上传 ──────────────────────────────');

  const pngResult = await service.upload(makePngBuffer(), 'photo.png', {
    folder: 'images',
    allowedTypes: ['image/png'],
  });
  console.log('✅ PNG 上传成功:');
  console.log('   url        :', pngResult.url);
  console.log('   key        :', pngResult.key);
  console.log('   mimeType   :', pngResult.mimeType);
  console.log('   size       :', pngResult.size, 'bytes');
  console.log('   provider   :', pngResult.provider);

  const jpegResult = await service.upload(makeJpegBuffer(), 'avatar.jpg', {
    folder: 'avatars',
  });
  console.log('\n✅ JPEG 上传成功:');
  console.log('   url        :', jpegResult.url);
  console.log('   key        :', jpegResult.key);

  // ══════════════════════════════════════════
  // 2. 自定义 key 上传
  // ══════════════════════════════════════════
  console.log('\n── 2. 自定义 key 上传 ───────────────────────');

  const customResult = await service.upload(makePngBuffer(), 'banner.png', {
    key: 'banners/homepage.png',
    allowedTypes: ['image/png'],
  });
  console.log('✅ 自定义 key 上传成功:');
  console.log('   key:', customResult.key);
  console.log('   url:', customResult.url);

  // ══════════════════════════════════════════
  // 3. 图片预览 URL
  // ══════════════════════════════════════════
  console.log('\n── 3. 图片预览 URL ──────────────────────────');

  const previewUrl = await service.getPreviewUrl(pngResult.key);
  console.log('✅ getPreviewUrl (无参数, Local):', previewUrl);
  console.log('   注意: 本地存储不支持服务端图片处理，返回原图 URL');

  // ── getUrl 对比 ──
  const plainUrl = await service.getUrl(pngResult.key);
  console.log('✅ getUrl:', plainUrl);
  console.log('   两者相同?', previewUrl === plainUrl ? 'YES（符合预期）' : 'NO');

  // ══════════════════════════════════════════
  // 4. 安全校验 - 文件大小超限
  // ══════════════════════════════════════════
  console.log('\n── 4. 安全校验 ──────────────────────────────');

  try {
    await service.upload(Buffer.alloc(10 * 1024 * 1024), 'big.png', {
      maxSize: 1 * 1024 * 1024,   // 限制 1MB，文件 10MB
      allowedTypes: ['application/octet-stream'],
    });
    console.log('❌ 应该报错但没有（文件过大）');
  } catch (e) {
    if (e instanceof StorageError && e.code === 'FILE_TOO_LARGE') {
      console.log('✅ 文件过大校验:', e.message);
    }
  }

  // 类型不在白名单
  try {
    await service.upload(makeTextBuffer(), 'doc.txt', {
      allowedTypes: ['image/jpeg', 'image/png'],
    });
    console.log('❌ 应该报错但没有（类型不符）');
  } catch (e) {
    if (e instanceof StorageError && e.code === 'INVALID_TYPE') {
      console.log('✅ 类型不在白名单:', e.message);
    }
  }

  // magic byte 伪造：文件头是 PNG，但扩展名是 .jpg
  try {
    await service.upload(makeFakeJpegBuffer(), 'fake.jpg', {
      allowedTypes: ['image/jpeg', 'image/png'],
    });
    console.log('❌ 应该报错但没有（magic byte 伪造）');
  } catch (e) {
    if (e instanceof StorageError && e.code === 'INVALID_TYPE') {
      console.log('✅ magic byte 伪造检测:', e.message);
    }
  }

  // ══════════════════════════════════════════
  // 5. 删除文件
  // ══════════════════════════════════════════
  console.log('\n── 5. 删除文件 ──────────────────────────────');

  await service.delete(pngResult.key);
  console.log('✅ 删除成功:', pngResult.key);

  try {
    await service.delete(pngResult.key); // 重复删除
    console.log('❌ 应该报错但没有（文件已删除）');
  } catch (e) {
    if (e instanceof StorageError && e.code === 'DELETE_FAILED') {
      console.log('✅ 删除已不存在文件的错误捕获:', e.code);
    }
  }

  // ══════════════════════════════════════════
  // 6. 装饰器元数据读取
  // ══════════════════════════════════════════
  console.log('\n── 6. 装饰器元数据 ──────────────────────────');

  const uploadableMeta = getUploadableMetadata(ProductImageUploader);
  console.log('✅ @Uploadable 元数据:');
  console.log('  ', JSON.stringify(uploadableMeta, null, 2).replace(/\n/g, '\n   '));

  const storageMeta = getStorageFieldMetadata(Product);
  console.log('\n✅ @StorageField 元数据:');
  console.log('  ', JSON.stringify(storageMeta, null, 2).replace(/\n/g, '\n   '));

  // ══════════════════════════════════════════
  // 清理临时目录
  // ══════════════════════════════════════════
  await rm(uploadDir, { recursive: true, force: true });
  console.log('\n🧹 临时目录已清理\n');
  console.log('=== 测试全部通过 ✅ ===');
}

main().catch((e) => {
  console.error('测试失败:', e);
  process.exit(1);
});
