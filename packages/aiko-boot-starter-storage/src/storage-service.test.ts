import { describe, expect, it, vi } from 'vitest';
import { StorageService } from './storage-service.js';
import { StorageError, type IStorageAdapter, type UploadOptions, type UploadResult } from './types.js';

class MockAdapter implements IStorageAdapter {
  async upload(file: Buffer, fileName: string, options: UploadOptions = {}): Promise<UploadResult> {
    return {
      url: `https://example.test/${fileName}`,
      key: fileName,
      size: file.length,
      mimeType: options.contentType ?? 'application/octet-stream',
      provider: 'local',
      originalName: fileName,
    };
  }
  async delete(_key: string): Promise<void> {}
  getUrl(key: string): string {
    return `https://example.test/${key}`;
  }
  getPreviewUrl(key: string): string {
    return this.getUrl(key);
  }
}

describe('StorageService', () => {
  it('rejects files that exceed maxSize', async () => {
    const service = new StorageService();
    service.setAdapter(new MockAdapter());

    await expect(service.upload(Buffer.alloc(11), 'avatar.jpg', { maxSize: 10 })).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    } satisfies Partial<StorageError>);
  });

  it('rejects mismatched magic mime and extension mime', async () => {
    const service = new StorageService();
    service.setAdapter(new MockAdapter());

    const pngMagic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
    await expect(service.upload(pngMagic, 'avatar.jpg')).rejects.toMatchObject({
      code: 'INVALID_TYPE',
    } satisfies Partial<StorageError>);
  });

  it('uses detected mime type when extension is unknown', async () => {
    const service = new StorageService();
    const adapter = new MockAdapter();
    const spy = vi.spyOn(adapter, 'upload');
    service.setAdapter(adapter);

    const jpegMagic = Buffer.from([255, 216, 255, 0]);
    await service.upload(jpegMagic, 'avatar.unknown-ext', { allowedTypes: ['image/jpeg'] });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[2]?.contentType).toBe('image/jpeg');
  });
});
