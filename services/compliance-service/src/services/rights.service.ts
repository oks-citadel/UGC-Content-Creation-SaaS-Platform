import { prisma } from '../lib/prisma';
import { LicenseType } from '@prisma/client';
import pino from 'pino';

const logger = pino({ name: 'rights-service' });

export class RightsService {
  async createContentRights(data: {
    contentId: string;
    creatorId: string;
    brandId?: string;
    licenseType: LicenseType;
    usageRights: string[];
    territory: string[];
    duration?: string;
    exclusivity?: boolean;
    canModify?: boolean;
    canResell?: boolean;
    attribution?: string;
    restrictions?: any;
    startsAt?: Date;
    endsAt?: Date;
    documentUrl?: string;
  }) {
    const rights = await prisma.contentRights.create({
      data: {
        ...data,
        signedAt: new Date(),
      },
    });

    logger.info({ rightsId: rights.id, contentId: data.contentId }, 'Content rights created');
    return rights;
  }

  async getContentRights(contentId: string) {
    return prisma.contentRights.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyRights(contentId: string, brandId: string, usageType: string): Promise<boolean> {
    const rights = await prisma.contentRights.findFirst({
      where: {
        contentId,
        brandId,
        usageRights: { has: usageType },
        OR: [
          { endsAt: null },
          { endsAt: { gte: new Date() } },
        ],
      },
    });

    return !!rights;
  }

  async transferRights(rightsId: string, newBrandId: string) {
    const rights = await prisma.contentRights.update({
      where: { id: rightsId },
      data: { brandId: newBrandId },
    });

    logger.info({ rightsId, newBrandId }, 'Rights transferred');
    return rights;
  }

  async revokeRights(rightsId: string) {
    const rights = await prisma.contentRights.update({
      where: { id: rightsId },
      data: { endsAt: new Date() },
    });

    logger.info({ rightsId }, 'Rights revoked');
    return rights;
  }
}

export const rightsService = new RightsService();
