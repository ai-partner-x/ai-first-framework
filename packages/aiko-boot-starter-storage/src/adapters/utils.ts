/**
 * 适配器通用工具函数
 */
import { extname } from 'path';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
};

/**
 * 根据文件名推断 MIME 类型
 * @param fileName 原始文件名
 * @returns MIME 类型字符串
 */
export function getMimeType(fileName: string): string {
  const ext = extname(fileName).toLowerCase();
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

/**
 * 根据文件头（magic number）检测 MIME 类型
 *
 * 当前仅支持以下类型检测：
 * - image/png
 * - image/jpeg
 * - image/gif
 * - image/webp
 * - application/pdf
 *
 * 其他文件类型（如 docx/mp4/zip 等）会返回 undefined，
 * 调用方应回退到扩展名推断或业务自定义策略。
 */
export function detectMimeTypeFromBuffer(file: Buffer): string | undefined {
  if (file.length >= 8) {
    if (
      file[0] === 137 && file[1] === 80 && file[2] === 78 && file[3] === 71 &&
      file[4] === 13 && file[5] === 10 && file[6] === 26 && file[7] === 10
    ) {
      return 'image/png';
    }
  }
  if (file.length >= 3) {
    if (file[0] === 255 && file[1] === 216 && file[2] === 255) {
      return 'image/jpeg';
    }
    if (file[0] === 71 && file[1] === 73 && file[2] === 70) {
      return 'image/gif';
    }
  }
  if (file.length >= 12) {
    if (
      file[0] === 82 && file[1] === 73 && file[2] === 70 && file[3] === 70 &&
      file[8] === 87 && file[9] === 69 && file[10] === 66 && file[11] === 80
    ) {
      return 'image/webp';
    }
  }
  if (file.length >= 4) {
    if (file[0] === 37 && file[1] === 80 && file[2] === 68 && file[3] === 70) {
      return 'application/pdf';
    }
  }
  return undefined;
}

/**
 * 构建存储 key
 * @param folder 目录前缀（可选）
 * @param name 文件名（含扩展名）
 * @returns 格式化的存储 key，如 'products/uuid.jpg'
 */
export function buildKey(folder: string | undefined, name: string): string {
  if (!folder) return name;
  const normalizedFolder = folder.replace(/^\/|\/$/g, '');
  return `${normalizedFolder}/${name}`;
}

/**
 * 校验 MIME 类型是否在白名单中（支持通配符 image/*）
 * @param mimeType 实际 MIME 类型
 * @param allowedTypes 允许的类型列表
 * @returns 是否允许
 */
export function isMimeTypeAllowed(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some((allowed) => {
    if (allowed === mimeType) return true;
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -2);
      return mimeType.startsWith(prefix + '/');
    }
    return false;
  });
}
