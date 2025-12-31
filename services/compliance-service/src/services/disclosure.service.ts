import { prisma } from '../lib/prisma';
import { DisclosureType } from '.prisma/compliance-service-client';
import pino from 'pino';

const logger = pino({ name: 'disclosure-service' });

const REQUIRED_DISCLOSURES: Record<string, string[]> = {
  instagram: ['#ad', '#sponsored', '#partner', '#gifted'],
  tiktok: ['#ad', '#sponsored', '#partnership'],
  youtube: ['paid promotion', 'sponsored', 'includes paid promotion'],
  facebook: ['#ad', '#sponsored', '#partner'],
};

export class DisclosureService {
  async createDisclosure(contentId: string, userId: string, type: DisclosureType, platform: string, text: string, metadata?: any) {
    const isCompliant = this.checkCompliance(platform, text, type);

    const disclosure = await prisma.disclosure.create({
      data: {
        contentId,
        userId,
        type,
        platform,
        text,
        isCompliant,
        metadata,
      },
    });

    logger.info({ disclosureId: disclosure.id, contentId, isCompliant }, 'Disclosure created');
    return disclosure;
  }

  checkCompliance(platform: string, text: string, type: DisclosureType): boolean {
    const platformLower = platform.toLowerCase();
    const textLower = text.toLowerCase();
    const required = REQUIRED_DISCLOSURES[platformLower] || [];

    // Check if text contains required disclosure keywords
    const hasRequiredDisclosure = required.some(keyword => textLower.includes(keyword.toLowerCase()));

    // Check placement (should be at the beginning)
    const isAtBeginning = required.some(keyword => textLower.startsWith(keyword.toLowerCase()));

    // For FTC compliance, disclosure should be clear and conspicuous
    const isClearAndConspicuous = text.length >= 3 && hasRequiredDisclosure;

    return hasRequiredDisclosure && (isAtBeginning || isClearAndConspicuous);
  }

  async reviewDisclosure(disclosureId: string, reviewedBy: string, isCompliant: boolean, notes?: string) {
    const disclosure = await prisma.disclosure.update({
      where: { id: disclosureId },
      data: {
        isCompliant,
        reviewedAt: new Date(),
        reviewedBy,
        notes,
      },
    });

    logger.info({ disclosureId, isCompliant }, 'Disclosure reviewed');
    return disclosure;
  }

  async getContentDisclosures(contentId: string) {
    return prisma.disclosure.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNonCompliantDisclosures(userId?: string) {
    const where: any = { isCompliant: false };
    if (userId) where.userId = userId;

    return prisma.disclosure.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateDisclosureText(type: DisclosureType, platform: string): Promise<string> {
    const templates: Record<DisclosureType, string> = {
      [DisclosureType.SPONSORED_CONTENT]: '#Ad - This is sponsored content',
      [DisclosureType.PAID_PARTNERSHIP]: '#Partner - This is a paid partnership',
      [DisclosureType.GIFTED_PRODUCT]: '#Gifted - This product was gifted to me',
      [DisclosureType.AFFILIATE_LINK]: '#AffiliateLink - This post contains affiliate links',
      [DisclosureType.BRAND_AMBASSADOR]: '#BrandAmbassador - I am a brand ambassador',
      [DisclosureType.EMPLOYEE]: '#Employee - I am an employee of this company',
      [DisclosureType.OTHER]: '#Disclosure - Paid promotion',
    };

    return templates[type] || templates[DisclosureType.OTHER];
  }
}

export const disclosureService = new DisclosureService();
