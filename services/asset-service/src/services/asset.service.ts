import { BlobServiceClient, ContainerClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

export interface UploadUrlParams {
  assetId: string;
  filename: string;
  contentType: string;
  size: number;
  metadata?: Record<string, string>;
}

export interface UploadUrlResponse {
  url: string;
  expiresAt: string;
  fields?: Record<string, string>;
}

export interface Asset {
  id: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: Record<string, string>;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  variants?: AssetVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetVariant {
  id: string;
  type: 'thumbnail' | 'preview' | 'optimized' | 'hd' | '4k';
  url: string;
  width?: number;
  height?: number;
  size: number;
  contentType: string;
}

export interface ProcessingJob {
  jobId: string;
  assetId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export class AssetService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerClient: ContainerClient | null = null;
  private assets: Map<string, Asset> = new Map(); // In-memory store for demo

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    if (config.azureStorageConnectionString) {
      try {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          config.azureStorageConnectionString
        );
        this.containerClient = this.blobServiceClient.getContainerClient(
          config.azureStorageContainerName
        );
        logger.info('Azure Blob Storage initialized');
      } catch (error) {
        logger.error({ error }, 'Failed to initialize Azure Blob Storage');
      }
    } else {
      logger.warn('Azure Storage not configured, using mock storage');
    }
  }

  async generateUploadUrl(params: UploadUrlParams): Promise<UploadUrlResponse> {
    const { assetId, filename, contentType, size, metadata } = params;

    // Validate file size
    if (size > config.maxFileSize) {
      throw new AppError(`File size exceeds maximum allowed (${config.maxFileSize} bytes)`, 400, 'FILE_TOO_LARGE');
    }

    // Validate content type specific limits
    if (contentType.startsWith('image/') && size > config.maxImageSize) {
      throw new AppError(`Image size exceeds maximum allowed (${config.maxImageSize} bytes)`, 400, 'IMAGE_TOO_LARGE');
    }

    if (contentType.startsWith('video/') && size > config.maxVideoSize) {
      throw new AppError(`Video size exceeds maximum allowed (${config.maxVideoSize} bytes)`, 400, 'VIDEO_TOO_LARGE');
    }

    const extension = filename.split('.').pop() || '';
    const blobName = `${assetId}/${Date.now()}-${uuidv4()}.${extension}`;
    const expiresAt = new Date(Date.now() + config.uploadUrlExpiry * 1000);

    // Create asset record
    const asset: Asset = {
      id: assetId,
      filename: blobName,
      originalFilename: filename,
      contentType,
      size,
      url: '',
      metadata: metadata || {},
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(assetId, asset);

    if (this.containerClient) {
      // Generate actual SAS URL for Azure Blob Storage
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // For real implementation, generate SAS token
      const sasUrl = blockBlobClient.url;

      return {
        url: sasUrl,
        expiresAt: expiresAt.toISOString(),
        fields: {
          'x-ms-blob-type': 'BlockBlob',
          'x-ms-blob-content-type': contentType,
        },
      };
    }

    // Mock response for development
    return {
      url: `https://mock-storage.blob.core.windows.net/${config.azureStorageContainerName}/${blobName}`,
      expiresAt: expiresAt.toISOString(),
      fields: {
        'x-ms-blob-type': 'BlockBlob',
        'x-ms-blob-content-type': contentType,
      },
    };
  }

  async getAsset(assetId: string): Promise<Asset | null> {
    const asset = this.assets.get(assetId);
    return asset || null;
  }

  async generateDownloadUrl(assetId: string): Promise<string> {
    const asset = await this.getAsset(assetId);

    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }

    if (this.containerClient) {
      const blockBlobClient = this.containerClient.getBlockBlobClient(asset.filename);
      // Generate SAS URL with read permission
      return blockBlobClient.url;
    }

    // Mock URL for development
    return `https://mock-storage.blob.core.windows.net/${config.azureStorageContainerName}/${asset.filename}?sig=mock`;
  }

  async getAssetVariants(assetId: string): Promise<AssetVariant[]> {
    const asset = await this.getAsset(assetId);

    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }

    return asset.variants || [];
  }

  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.getAsset(assetId);

    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }

    if (this.containerClient) {
      const blockBlobClient = this.containerClient.getBlockBlobClient(asset.filename);
      await blockBlobClient.deleteIfExists();

      // Delete variants
      if (asset.variants) {
        for (const variant of asset.variants) {
          const variantClient = this.containerClient.getBlockBlobClient(`${assetId}/${variant.id}`);
          await variantClient.deleteIfExists();
        }
      }
    }

    this.assets.delete(assetId);
    logger.info({ assetId }, 'Asset deleted');
  }

  async triggerProcessing(assetId: string): Promise<ProcessingJob> {
    const asset = await this.getAsset(assetId);

    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }

    const jobId = uuidv4();
    const job: ProcessingJob = {
      jobId,
      assetId,
      status: 'queued',
      progress: 0,
    };

    // Update asset status
    asset.status = 'processing';
    asset.updatedAt = new Date().toISOString();
    this.assets.set(assetId, asset);

    // In production, this would queue a message to Service Bus
    // for the video-processor worker to pick up
    if (config.transcodingQueueUrl) {
      // await queueService.sendMessage(config.transcodingQueueUrl, job);
    }

    logger.info({ jobId, assetId }, 'Processing job queued');

    return job;
  }

  async updateAssetStatus(assetId: string, status: Asset['status'], variants?: AssetVariant[]): Promise<void> {
    const asset = await this.getAsset(assetId);

    if (asset) {
      asset.status = status;
      asset.updatedAt = new Date().toISOString();
      if (variants) {
        asset.variants = variants;
      }
      this.assets.set(assetId, asset);
    }
  }
}
