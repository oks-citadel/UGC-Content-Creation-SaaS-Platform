import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn(() => ({
      getContainerClient: vi.fn(() => ({
        getBlockBlobClient: vi.fn((blobName: string) => ({
          url: `https://mock-storage.blob.core.windows.net/assets/${blobName}`,
          deleteIfExists: vi.fn().mockResolvedValue(true),
        })),
      })),
    })),
  },
  ContainerClient: vi.fn(),
  generateBlobSASQueryParameters: vi.fn(),
  BlobSASPermissions: { parse: vi.fn() },
  StorageSharedKeyCredential: vi.fn(),
}));

vi.mock('uuid', () => ({ v4: vi.fn(() => 'mock-uuid-1234') }));

vi.mock('../../../../services/asset-service/src/config', () => ({
  config: {
    azureStorageConnectionString: 'mock-connection-string',
    azureStorageContainerName: 'assets',
    maxFileSize: 100 * 1024 * 1024,
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 500 * 1024 * 1024,
    uploadUrlExpiry: 3600,
    cdnEndpoint: 'https://test-cdn.azureedge.net',
    transcodingQueueUrl: 'https://mock-queue.servicebus.windows.net',
  },
}));

vi.mock('../../../../services/asset-service/src/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../../services/asset-service/src/middleware/error-handler', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number, public code: string) {
      super(message);
      this.name = 'AppError';
    }
  },
}));

import { AssetService } from '../../../../services/asset-service/src/services/asset.service';

describe('AssetService', () => {
  let assetService: AssetService;

  beforeEach(() => {
    assetService = new AssetService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateUploadUrl', () => {
    it('should generate a valid upload URL', async () => {
      const params = {
        assetId: 'asset-123',
        filename: 'test-video.mp4',
        contentType: 'video/mp4',
        size: 10 * 1024 * 1024,
        metadata: { userId: 'user-123' },
      };
      const result = await assetService.generateUploadUrl(params);
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('fields');
      expect(result.url).toContain('mock-storage.blob.core.windows.net');
    });

    it('should reject files exceeding maximum file size', async () => {
      const params = {
        assetId: 'asset-123',
        filename: 'large-file.mp4',
        contentType: 'video/mp4',
        size: 200 * 1024 * 1024,
      };
      await expect(assetService.generateUploadUrl(params)).rejects.toThrow('File size exceeds');
    });

    it('should reject images exceeding maximum image size', async () => {
      const params = {
        assetId: 'asset-123',
        filename: 'large-image.jpg',
        contentType: 'image/jpeg',
        size: 25 * 1024 * 1024,
      };
      await expect(assetService.generateUploadUrl(params)).rejects.toThrow('Image size exceeds');
    });

    it('should reject videos exceeding maximum video size', async () => {
      const params = {
        assetId: 'asset-123',
        filename: 'massive-video.mp4',
        contentType: 'video/mp4',
        size: 600 * 1024 * 1024,
      };
      await expect(assetService.generateUploadUrl(params)).rejects.toThrow('File size exceeds');
    });
  });

  describe('Asset Metadata Handling', () => {
    it('should store asset with metadata', async () => {
      const params = {
        assetId: 'asset-456',
        filename: 'test-file.png',
        contentType: 'image/png',
        size: 2 * 1024 * 1024,
        metadata: { userId: 'user-789' },
      };
      await assetService.generateUploadUrl(params);
      const asset = await assetService.getAsset('asset-456');
      expect(asset?.metadata).toEqual(params.metadata);
    });

    it('should set initial status to pending', async () => {
      await assetService.generateUploadUrl({
        assetId: 'asset-status-test',
        filename: 'test.mp4',
        contentType: 'video/mp4',
        size: 5 * 1024 * 1024,
      });
      const asset = await assetService.getAsset('asset-status-test');
      expect(asset?.status).toBe('pending');
    });
  });

  describe('CDN URL Generation', () => {
    it('should generate download URL for existing asset', async () => {
      await assetService.generateUploadUrl({
        assetId: 'cdn-test-asset',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 1024 * 1024,
      });
      const downloadUrl = await assetService.generateDownloadUrl('cdn-test-asset');
      expect(downloadUrl).toContain('mock-storage.blob.core.windows.net');
    });

    it('should throw error for non-existent asset', async () => {
      await expect(assetService.generateDownloadUrl('non-existent')).rejects.toThrow('Asset not found');
    });
  });

  describe('Variant Creation', () => {
    it('should return empty array for asset without variants', async () => {
      await assetService.generateUploadUrl({
        assetId: 'no-variants',
        filename: 'test.mp4',
        contentType: 'video/mp4',
        size: 10 * 1024 * 1024,
      });
      const variants = await assetService.getAssetVariants('no-variants');
      expect(variants).toEqual([]);
    });

    it('should update asset status after processing', async () => {
      await assetService.generateUploadUrl({
        assetId: 'processing-test',
        filename: 'video.mp4',
        contentType: 'video/mp4',
        size: 20 * 1024 * 1024,
      });
      const variants = [
        { id: 'thumb-1', type: 'thumbnail' as const, url: 'https://cdn.example.com/thumb.jpg', width: 320, height: 180, size: 50000, contentType: 'image/jpeg' },
      ];
      await assetService.updateAssetStatus('processing-test', 'ready', variants);
      const asset = await assetService.getAsset('processing-test');
      expect(asset?.status).toBe('ready');
      expect(asset?.variants).toHaveLength(1);
    });
  });

  describe('Processing Jobs', () => {
    it('should trigger processing for valid asset', async () => {
      await assetService.generateUploadUrl({
        assetId: 'process-test',
        filename: 'video.mp4',
        contentType: 'video/mp4',
        size: 30 * 1024 * 1024,
      });
      const job = await assetService.triggerProcessing('process-test');
      expect(job).toHaveProperty('jobId');
      expect(job).toHaveProperty('status', 'queued');
    });
  });

  describe('Asset Deletion', () => {
    it('should delete existing asset', async () => {
      await assetService.generateUploadUrl({
        assetId: 'delete-test',
        filename: 'to-delete.jpg',
        contentType: 'image/jpeg',
        size: 1024 * 1024,
      });
      await assetService.deleteAsset('delete-test');
      const asset = await assetService.getAsset('delete-test');
      expect(asset).toBeNull();
    });

    it('should throw error when deleting non-existent asset', async () => {
      await expect(assetService.deleteAsset('does-not-exist')).rejects.toThrow('Asset not found');
    });
  });
});
