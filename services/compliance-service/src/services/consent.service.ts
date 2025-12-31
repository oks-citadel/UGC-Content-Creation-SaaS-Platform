import { prisma } from '../lib/prisma';
import { ConsentType } from '.prisma/compliance-service-client';
import pino from 'pino';

const logger = pino({ name: 'consent-service' });

export class ConsentService {
  async grant(userId: string, type: ConsentType, purpose: string, version: string, ipAddress?: string, userAgent?: string, metadata?: any) {
    const consent = await prisma.consent.create({
      data: {
        userId,
        type,
        purpose,
        version,
        granted: true,
        grantedAt: new Date(),
        ipAddress,
        userAgent,
        metadata,
      },
    });

    logger.info({ userId, type, consentId: consent.id }, 'Consent granted');
    return consent;
  }

  async revoke(userId: string, type: ConsentType) {
    const consent = await prisma.consent.updateMany({
      where: { userId, type, granted: true },
      data: { granted: false, revokedAt: new Date() },
    });

    logger.info({ userId, type }, 'Consent revoked');
    return consent;
  }

  async check(userId: string, type: ConsentType): Promise<boolean> {
    const consent = await prisma.consent.findFirst({
      where: { userId, type, granted: true },
      orderBy: { grantedAt: 'desc' },
    });

    return !!consent;
  }

  async getAll(userId: string) {
    return prisma.consent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistory(userId: string, type: ConsentType) {
    return prisma.consent.findMany({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const consentService = new ConsentService();
