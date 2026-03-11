import { mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { LocalStorageAdapter } from './local.js';
import { OssStorageAdapter } from './oss.js';
import { CosStorageAdapter } from './cos.js';
import { S3StorageAdapter } from './s3.js';

describe('adapters', () => {
  it('LocalStorageAdapter supports upload/delete/getUrl', async () => {
    const uploadDir = await mkdtemp(join(tmpdir(), 'aiko-storage-local-'));
    const adapter = new LocalStorageAdapter({
      uploadDir,
      baseUrl: 'http://localhost:3000/uploads/',
    });
    const file = Buffer.from('hello local');

    const uploaded = await adapter.upload(file, 'note.txt', { key: 'docs/note.txt' });
    expect(uploaded.key).toBe('docs/note.txt');
    expect(uploaded.url).toBe('http://localhost:3000/uploads/docs/note.txt');
    expect(await readFile(join(uploadDir, 'docs/note.txt'), 'utf8')).toBe('hello local');

    await adapter.delete('docs/note.txt');
  });

  it('OssStorageAdapter supports upload/delete/getUrl with mocked client', async () => {
    const put = vi.fn(async () => undefined);
    const remove = vi.fn(async () => undefined);
    const adapter = new OssStorageAdapter({
      bucket: 'demo-bucket',
      region: 'oss-cn-hangzhou',
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      customDomain: 'https://cdn.example.com/',
    });
    ((adapter as unknown) as { client: unknown }).client = { put, delete: remove };

    const uploaded = await adapter.upload(Buffer.from('oss'), 'photo.jpg', { key: 'images/photo.jpg' });
    expect(put).toHaveBeenCalledWith('images/photo.jpg', expect.any(Buffer), { mime: 'image/jpeg' });
    expect(uploaded.url).toBe('https://cdn.example.com/images/photo.jpg');
    expect(adapter.getUrl('images/photo.jpg')).toBe('https://cdn.example.com/images/photo.jpg');

    await adapter.delete('images/photo.jpg');
    expect(remove).toHaveBeenCalledWith('images/photo.jpg');
  });

  it('CosStorageAdapter supports upload/delete/getUrl with mocked client', async () => {
    const putObject = vi.fn((_: unknown, cb: (err?: unknown) => void) => cb());
    const deleteObject = vi.fn((_: unknown, cb: (err?: unknown) => void) => cb());
    const adapter = new CosStorageAdapter({
      bucket: 'demo-bucket-123',
      region: 'ap-guangzhou',
      secretId: 'sid',
      secretKey: 'skey',
      customDomain: 'https://cos-cdn.example.com/',
    });
    ((adapter as unknown) as { client: unknown }).client = { putObject, deleteObject };

    const uploaded = await adapter.upload(Buffer.from('cos'), 'photo.jpg', { key: 'images/photo.jpg' });
    expect(putObject).toHaveBeenCalledTimes(1);
    expect(uploaded.url).toBe('https://cos-cdn.example.com/images/photo.jpg');
    expect(adapter.getUrl('images/photo.jpg')).toBe('https://cos-cdn.example.com/images/photo.jpg');

    await adapter.delete('images/photo.jpg');
    expect(deleteObject).toHaveBeenCalledTimes(1);
  });

  it('S3StorageAdapter validates ACL settings before upload', async () => {
    const adapter = new S3StorageAdapter({
      bucket: 'demo-bucket',
      region: 'us-east-1',
      accessKeyId: 'ak',
      secretAccessKey: 'sk',
      aclEnabled: false,
    });

    await expect(adapter.upload(Buffer.from('s3'), 'photo.jpg', { acl: 'public-read' })).rejects.toMatchObject({
      code: 'INVALID_CONFIG',
    });
  });
});
