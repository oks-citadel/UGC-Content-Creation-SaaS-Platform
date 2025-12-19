// =============================================================================
// Cloud Storage Mock Implementation (S3/GCS)
// =============================================================================

import { vi } from 'vitest';

export const mockStorage = {
  upload: vi.fn().mockImplementation((file: any) => {
    return Promise.resolve({
      key: `uploads/${Date.now()}-${file.originalname || 'file.txt'}`,
      url: `https://storage.example.com/uploads/${Date.now()}-${file.originalname || 'file.txt'}`,
      bucket: 'nexus-uploads',
      size: file.size || 1024,
      contentType: file.mimetype || 'application/octet-stream',
      etag: 'mock-etag-' + Math.random().toString(36),
    });
  }),

  download: vi.fn().mockImplementation((key: string) => {
    return Promise.resolve({
      key,
      body: Buffer.from('mock file content'),
      contentType: 'application/octet-stream',
      contentLength: 18,
    });
  }),

  getSignedUrl: vi.fn().mockImplementation((key: string, expiresIn = 3600) => {
    return Promise.resolve(
      `https://storage.example.com/${key}?signature=mock-signature&expires=${Date.now() + expiresIn * 1000}`
    );
  }),

  delete: vi.fn().mockImplementation((key: string) => {
    return Promise.resolve({
      key,
      deleted: true,
    });
  }),

  deleteMultiple: vi.fn().mockImplementation((keys: string[]) => {
    return Promise.resolve({
      deleted: keys,
      errors: [],
    });
  }),

  exists: vi.fn().mockImplementation((key: string) => {
    return Promise.resolve(true);
  }),

  getMetadata: vi.fn().mockImplementation((key: string) => {
    return Promise.resolve({
      key,
      size: 1024,
      contentType: 'application/octet-stream',
      lastModified: new Date(),
      etag: 'mock-etag',
    });
  }),

  listObjects: vi.fn().mockImplementation((prefix: string, maxKeys = 1000) => {
    return Promise.resolve({
      objects: [
        {
          key: `${prefix}file1.txt`,
          size: 1024,
          lastModified: new Date(),
        },
        {
          key: `${prefix}file2.txt`,
          size: 2048,
          lastModified: new Date(),
        },
      ],
      isTruncated: false,
      nextMarker: null,
    });
  }),

  copyObject: vi.fn().mockImplementation((sourceKey: string, destKey: string) => {
    return Promise.resolve({
      sourceKey,
      destKey,
      copied: true,
    });
  }),
};

// Mock for image/video processing
export const mockMediaProcessor = {
  generateThumbnail: vi.fn().mockImplementation((fileKey: string) => {
    return Promise.resolve({
      thumbnail: `${fileKey}-thumb.jpg`,
      url: `https://storage.example.com/${fileKey}-thumb.jpg`,
    });
  }),

  resizeImage: vi.fn().mockImplementation((fileKey: string, width: number, height: number) => {
    return Promise.resolve({
      resized: `${fileKey}-${width}x${height}.jpg`,
      url: `https://storage.example.com/${fileKey}-${width}x${height}.jpg`,
      width,
      height,
    });
  }),

  compressVideo: vi.fn().mockImplementation((fileKey: string, quality = 'medium') => {
    return Promise.resolve({
      compressed: `${fileKey}-compressed.mp4`,
      url: `https://storage.example.com/${fileKey}-compressed.mp4`,
      quality,
      originalSize: 10485760, // 10MB
      compressedSize: 5242880, // 5MB
      compressionRatio: 0.5,
    });
  }),

  extractVideoMetadata: vi.fn().mockImplementation((fileKey: string) => {
    return Promise.resolve({
      duration: 30.5,
      width: 1920,
      height: 1080,
      fps: 30,
      codec: 'h264',
      bitrate: 5000000,
      size: 10485760,
    });
  }),

  generateVideoPreview: vi.fn().mockImplementation((fileKey: string) => {
    return Promise.resolve({
      preview: `${fileKey}-preview.gif`,
      url: `https://storage.example.com/${fileKey}-preview.gif`,
      duration: 3,
    });
  }),
};

// Factory function
export function createStorageMock() {
  return mockStorage;
}

// Reset all mocks
export function resetStorageMocks() {
  Object.values(mockStorage).forEach((method) => {
    if (typeof method === 'function' && 'mockClear' in method) {
      method.mockClear();
    }
  });

  Object.values(mockMediaProcessor).forEach((method) => {
    if (typeof method === 'function' && 'mockClear' in method) {
      method.mockClear();
    }
  });
}

export default mockStorage;
