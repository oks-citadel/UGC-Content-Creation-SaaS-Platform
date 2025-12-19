import { prisma } from '../lib/prisma';
import { DataRequestType, RequestStatus } from '@prisma/client';
import { config } from '../config';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

const logger = pino({ name: 'gdpr-service' });

export class GDPRService {
  async requestDataExport(userId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.gdpr.dataExportExpiryDays);

    const request = await prisma.dataRequest.create({
      data: {
        userId,
        type: DataRequestType.EXPORT,
        status: RequestStatus.PENDING,
        expiresAt,
      },
    });

    // Process export asynchronously
    this.processDataExport(request.id, userId).catch(error => {
      logger.error({ error, requestId: request.id }, 'Failed to process data export');
    });

    logger.info({ userId, requestId: request.id }, 'Data export requested');
    return request.id;
  }

  private async processDataExport(requestId: string, userId: string): Promise<void> {
    try {
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.PROCESSING, processedAt: new Date() },
      });

      // Collect all user data
      const userData = {
        user: await this.getUserData(userId),
        consents: await prisma.consent.findMany({ where: { userId } }),
        contentRights: await prisma.contentRights.findMany({ where: { creatorId: userId } }),
        disclosures: await prisma.disclosure.findMany({ where: { userId } }),
        auditLogs: await prisma.auditLog.findMany({ where: { userId } }),
      };

      // Create archive
      const exportDir = config.storage.exportPath;
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const archivePath = path.join(exportDir, `${userId}-${requestId}.zip`);
      const output = fs.createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        const downloadUrl = `/exports/${userId}-${requestId}.zip`;
        await prisma.dataRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.COMPLETED,
            completedAt: new Date(),
            downloadUrl,
          },
        });

        logger.info({ requestId, userId }, 'Data export completed');
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);
      archive.append(JSON.stringify(userData, null, 2), { name: 'user-data.json' });
      await archive.finalize();
    } catch (error: any) {
      logger.error({ error, requestId }, 'Failed to export data');
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.FAILED,
          completedAt: new Date(),
          notes: error.message,
        },
      });
    }
  }

  async requestDataDeletion(userId: string, notes?: string): Promise<string> {
    const request = await prisma.dataRequest.create({
      data: {
        userId,
        type: DataRequestType.DELETE,
        status: RequestStatus.PENDING,
        notes,
      },
    });

    logger.info({ userId, requestId: request.id }, 'Data deletion requested');
    return request.id;
  }

  async processDataDeletion(requestId: string): Promise<void> {
    const request = await prisma.dataRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.type !== DataRequestType.DELETE) {
      throw new Error('Invalid deletion request');
    }

    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.PROCESSING, processedAt: new Date() },
    });

    try {
      // Delete user data (implement based on your data model)
      await prisma.$transaction([
        prisma.consent.deleteMany({ where: { userId: request.userId } }),
        prisma.disclosure.deleteMany({ where: { userId: request.userId } }),
        prisma.contentRights.deleteMany({ where: { creatorId: request.userId } }),
        // Add more deletions as needed
      ]);

      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.COMPLETED, completedAt: new Date() },
      });

      logger.info({ requestId, userId: request.userId }, 'Data deletion completed');
    } catch (error: any) {
      logger.error({ error, requestId }, 'Failed to delete data');
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.FAILED, completedAt: new Date(), notes: error.message },
      });
      throw error;
    }
  }

  private async getUserData(userId: string): Promise<any> {
    // This would typically call the user service
    // For now, return a placeholder
    return { userId, note: 'User data would be fetched from user service' };
  }
}

export const gdprService = new GDPRService();
