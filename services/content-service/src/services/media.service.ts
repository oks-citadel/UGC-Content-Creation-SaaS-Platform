import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { uploadBlob, deleteBlob, generateBlobName } from '../lib/storage';
import { AppError } from '@nexus/utils';
import { config } from '../config';

export interface UploadMediaInput {
  file: Express.Multer.File;
  organizationId?: string;
  userId: string;
}

export interface MediaResult {
  id: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  cdnUrl?: string;
  width?: number;
  height?: number;
  size: number;
}

class MediaService {
  async uploadMedia(input: UploadMediaInput): Promise<MediaResult> {
    const { file, organizationId, userId } = input;

    // Determine media type
    const type = this.getMediaType(file.mimetype);
    if (!type) {
      throw new AppError('Unsupported file type', 400);
    }

    // Generate blob name
    const blobName = generateBlobName(file.originalname, organizationId || 'public');

    // Create media record
    const media = await prisma.media.create({
      data: {
        id: uuidv4(),
        organizationId,
        uploadedBy: userId,
        type,
        originalFilename: file.originalname,
        filename: blobName,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        status: 'PROCESSING',
      },
    });

    try {
      // Upload to Azure Storage
      const { url, cdnUrl } = await uploadBlob(blobName, file.buffer, file.mimetype);

      let width: number | undefined;
      let height: number | undefined;
      let thumbnailUrl: string | undefined;

      // Process image
      if (type === 'IMAGE') {
        const imageInfo = await sharp(file.buffer).metadata();
        width = imageInfo.width;
        height = imageInfo.height;

        // Generate thumbnail
        const thumbnail = await sharp(file.buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailBlobName = generateBlobName('thumbnail.jpg', `${organizationId || 'public'}/thumbnails`);
        const thumbnailResult = await uploadBlob(thumbnailBlobName, thumbnail, 'image/jpeg');
        thumbnailUrl = thumbnailResult.cdnUrl || thumbnailResult.url;

        // Generate additional versions
        await this.generateImageVersions(media.id, file.buffer, blobName, organizationId);
      }

      // Update media record
      const updatedMedia = await prisma.media.update({
        where: { id: media.id },
        data: {
          url,
          cdnUrl,
          thumbnailUrl,
          width,
          height,
          status: 'READY',
        },
      });

      return {
        id: updatedMedia.id,
        type: updatedMedia.type,
        url: updatedMedia.cdnUrl || updatedMedia.url,
        thumbnailUrl: updatedMedia.thumbnailUrl || undefined,
        cdnUrl: updatedMedia.cdnUrl || undefined,
        width: updatedMedia.width || undefined,
        height: updatedMedia.height || undefined,
        size: Number(updatedMedia.size),
      };
    } catch (error) {
      // Update status to error
      await prisma.media.update({
        where: { id: media.id },
        data: {
          status: 'ERROR',
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  async getMedia(mediaId: string, userId: string): Promise<MediaResult> {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { versions: true },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    return {
      id: media.id,
      type: media.type,
      url: media.cdnUrl || media.url,
      thumbnailUrl: media.thumbnailUrl || undefined,
      cdnUrl: media.cdnUrl || undefined,
      width: media.width || undefined,
      height: media.height || undefined,
      size: Number(media.size),
    };
  }

  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { versions: true },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    // Check ownership
    if (media.uploadedBy !== userId) {
      throw new AppError('Not authorized to delete this media', 403);
    }

    // Delete from storage
    await deleteBlob(media.filename);

    // Delete versions
    for (const version of media.versions) {
      const versionBlobName = version.url.split('/').pop();
      if (versionBlobName) {
        await deleteBlob(versionBlobName);
      }
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });
  }

  async listMedia(
    userId: string,
    organizationId?: string,
    type?: string,
    page = 1,
    limit = 20
  ) {
    const where = {
      ...(organizationId ? { organizationId } : { uploadedBy: userId }),
      ...(type && { type: type as 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' }),
      status: 'READY' as const,
    };

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.media.count({ where }),
    ]);

    return {
      data: media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.cdnUrl || m.url,
        thumbnailUrl: m.thumbnailUrl,
        width: m.width,
        height: m.height,
        size: Number(m.size),
        originalFilename: m.originalFilename,
        createdAt: m.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async generateImageVersions(
    mediaId: string,
    buffer: Buffer,
    originalBlobName: string,
    organizationId?: string
  ): Promise<void> {
    const versions = [
      { name: 'small', width: 480 },
      { name: 'medium', width: 1024 },
      { name: 'large', width: 1920 },
    ];

    for (const version of versions) {
      try {
        const resized = await sharp(buffer)
          .resize(version.width, undefined, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        const info = await sharp(resized).metadata();
        const blobName = generateBlobName(`${version.name}.jpg`, `${organizationId || 'public'}/versions`);
        const { url } = await uploadBlob(blobName, resized, 'image/jpeg');

        await prisma.mediaVersion.create({
          data: {
            mediaId,
            version: version.name,
            width: info.width,
            height: info.height,
            size: BigInt(resized.length),
            url,
          },
        });
      } catch (error) {
        console.error(`Failed to generate ${version.name} version:`, error);
      }
    }
  }

  private getMediaType(mimeType: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | null {
    if (config.upload.allowedImageTypes.includes(mimeType)) {
      return 'IMAGE';
    }
    if (config.upload.allowedVideoTypes.includes(mimeType)) {
      return 'VIDEO';
    }
    if (mimeType.startsWith('audio/')) {
      return 'AUDIO';
    }
    if (mimeType === 'application/pdf' || mimeType.includes('document')) {
      return 'DOCUMENT';
    }
    return null;
  }
}

export const mediaService = new MediaService();
