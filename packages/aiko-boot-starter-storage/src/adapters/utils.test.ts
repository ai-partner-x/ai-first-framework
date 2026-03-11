import { describe, expect, it } from 'vitest';
import { detectMimeTypeFromBuffer, getMimeType, isMimeTypeAllowed } from './utils.js';

describe('adapters/utils', () => {
  it('detects common mime types from magic bytes', () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const jpeg = Buffer.from([255, 216, 255]);
    const gif = Buffer.from([71, 73, 70]);
    const webp = Buffer.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
    const pdf = Buffer.from([37, 80, 68, 70]);

    expect(detectMimeTypeFromBuffer(png)).toBe('image/png');
    expect(detectMimeTypeFromBuffer(jpeg)).toBe('image/jpeg');
    expect(detectMimeTypeFromBuffer(gif)).toBe('image/gif');
    expect(detectMimeTypeFromBuffer(webp)).toBe('image/webp');
    expect(detectMimeTypeFromBuffer(pdf)).toBe('application/pdf');
  });

  it('returns undefined for unsupported or too-short buffers', () => {
    expect(detectMimeTypeFromBuffer(Buffer.from([]))).toBeUndefined();
    expect(detectMimeTypeFromBuffer(Buffer.from([255, 216]))).toBeUndefined();
    expect(detectMimeTypeFromBuffer(Buffer.from([80, 75, 3, 4]))).toBeUndefined();
  });

  it('infers mime by extension and supports wildcard allowlist', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
    expect(getMimeType('unknown.bin')).toBe('application/octet-stream');

    expect(isMimeTypeAllowed('image/png', ['image/*'])).toBe(true);
    expect(isMimeTypeAllowed('application/pdf', ['image/*'])).toBe(false);
  });
});
