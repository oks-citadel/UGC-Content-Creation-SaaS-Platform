import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface CreateUgcActivationInput {
  organizationId: string;
  brandId: string;
  campaignId?: string;
  contentId: string;
  creatorId?: string;
  name: string;
  description?: string;
  targeting?: Record<string, any>;
  attributionConfig?: Record<string, any>;
  utmParams?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
  createdBy: string;
}

export interface UpdateUgcActivationInput {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'ARCHIVED';
  targeting?: Record<string, any>;
  attributionConfig?: Record<string, any>;
  utmParams?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

export interface GenerateEmbedInput {
  type: 'JAVASCRIPT' | 'IFRAME' | 'DIRECT_LINK' | 'REACT' | 'VUE' | 'WEB_COMPONENT' | 'AMP';
  settings?: {
    width?: string;
    height?: string;
    autoplay?: boolean;
    muted?: boolean;
    responsive?: boolean;
  };
  expiresAt?: string;
}

export interface TrackEventInput {
  eventType: 'view' | 'click' | 'engagement' | 'conversion';
  visitorId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  device?: string;
  metadata?: Record<string, any>;
  // For conversions
  conversionType?: string;
  value?: number;
  currency?: string;
  orderId?: string;
  productId?: string;
}

export class UgcActivationService {
  private baseUrl = process.env.EMBED_BASE_URL || 'https://embed.nexus.io';

  async create(input: CreateUgcActivationInput) {
    const activation = await prisma.ugcActivation.create({
      data: {
        id: uuidv4(),
        organizationId: input.organizationId,
        brandId: input.brandId,
        campaignId: input.campaignId,
        contentId: input.contentId,
        creatorId: input.creatorId,
        name: input.name,
        description: input.description,
        targeting: input.targeting as any,
        attributionConfig: input.attributionConfig as any,
        utmParams: input.utmParams as any,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        metadata: input.metadata as any,
        createdBy: input.createdBy,
      },
    });

    logger.info({ activationId: activation.id }, 'UGC Activation created');
    return activation;
  }

  async getById(id: string) {
    return prisma.ugcActivation.findUnique({
      where: { id },
      include: {
        embedCodes: { where: { isActive: true } },
        _count: {
          select: {
            trackingEvents: true,
            conversions: true,
          },
        },
      },
    });
  }

  async update(id: string, input: UpdateUgcActivationInput) {
    const activation = await prisma.ugcActivation.update({
      where: { id },
      data: {
        ...input,
        targeting: input.targeting as any,
        attributionConfig: input.attributionConfig as any,
        utmParams: input.utmParams as any,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        metadata: input.metadata as any,
      },
    });

    logger.info({ activationId: id }, 'UGC Activation updated');
    return activation;
  }

  async delete(id: string) {
    await prisma.ugcActivation.delete({ where: { id } });
    logger.info({ activationId: id }, 'UGC Activation deleted');
  }

  async generateEmbedCode(activationId: string, input: GenerateEmbedInput) {
    const activation = await prisma.ugcActivation.findUnique({
      where: { id: activationId },
    });

    if (!activation) {
      throw new Error('Activation not found');
    }

    const hash = crypto.randomBytes(16).toString('hex');
    const embedUrl = `${this.baseUrl}/ugc/${hash}`;

    let code: string;
    switch (input.type) {
      case 'JAVASCRIPT':
        code = this.generateJavaScriptEmbed(hash, input.settings);
        break;
      case 'IFRAME':
        code = this.generateIframeEmbed(embedUrl, input.settings);
        break;
      case 'DIRECT_LINK':
        code = embedUrl;
        break;
      case 'REACT':
        code = this.generateReactEmbed(hash, input.settings);
        break;
      case 'VUE':
        code = this.generateVueEmbed(hash, input.settings);
        break;
      case 'WEB_COMPONENT':
        code = this.generateWebComponentEmbed(hash, input.settings);
        break;
      case 'AMP':
        code = this.generateAmpEmbed(embedUrl, input.settings);
        break;
      default:
        code = embedUrl;
    }

    const embedCode = await prisma.ugcEmbedCode.create({
      data: {
        id: uuidv4(),
        activationId,
        type: input.type,
        code,
        hash,
        settings: input.settings as any,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    logger.info({ activationId, embedId: embedCode.id, type: input.type }, 'Embed code generated');
    return embedCode;
  }

  async getEmbedCodes(activationId: string) {
    return prisma.ugcEmbedCode.findMany({
      where: { activationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async trackEvent(activationId: string, input: TrackEventInput) {
    // Record tracking event
    const event = await prisma.ugcTrackingEvent.create({
      data: {
        id: uuidv4(),
        activationId,
        eventType: input.eventType,
        visitorId: input.visitorId,
        sessionId: input.sessionId,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        referrer: input.referrer,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        country: input.country,
        device: input.device,
        metadata: input.metadata as any,
      },
    });

    // If it's a conversion event, also record in conversions table
    if (input.eventType === 'conversion' && input.visitorId) {
      await this.recordConversion(activationId, {
        visitorId: input.visitorId,
        conversionType: input.conversionType || 'general',
        value: input.value || 0,
        currency: input.currency || 'USD',
        orderId: input.orderId,
        productId: input.productId,
        metadata: input.metadata,
      });
    }

    logger.info({ activationId, eventType: input.eventType }, 'Tracking event recorded');
    return event;
  }

  async recordConversion(
    activationId: string,
    input: {
      visitorId: string;
      conversionType: string;
      value: number;
      currency: string;
      orderId?: string;
      productId?: string;
      touchpoints?: any;
      metadata?: Record<string, any>;
    }
  ) {
    // Get previous touchpoints for this visitor
    const touchpoints = await prisma.ugcTrackingEvent.findMany({
      where: {
        activationId,
        visitorId: input.visitorId,
      },
      orderBy: { timestamp: 'asc' },
      select: {
        eventType: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        timestamp: true,
      },
    });

    const conversion = await prisma.ugcConversion.create({
      data: {
        id: uuidv4(),
        activationId,
        visitorId: input.visitorId,
        conversionType: input.conversionType,
        value: input.value,
        currency: input.currency,
        orderId: input.orderId,
        productId: input.productId,
        touchpoints: touchpoints as any,
        metadata: input.metadata as any,
      },
    });

    logger.info({ activationId, conversionId: conversion.id }, 'Conversion recorded');
    return conversion;
  }

  async getAnalytics(activationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { activationId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [events, conversions] = await Promise.all([
      prisma.ugcTrackingEvent.groupBy({
        by: ['eventType'],
        where,
        _count: { id: true },
      }),
      prisma.ugcConversion.aggregate({
        where,
        _count: { id: true },
        _sum: { value: true },
      }),
    ]);

    return {
      events: Object.fromEntries(events.map((e) => [e.eventType, e._count.id])),
      conversions: {
        count: conversions._count.id,
        totalValue: conversions._sum.value || 0,
      },
    };
  }

  // Embed code generators
  private generateJavaScriptEmbed(hash: string, settings?: any): string {
    return `<script src="${this.baseUrl}/embed.js" data-nexus-ugc="${hash}"${
      settings?.autoplay ? ' data-autoplay="true"' : ''
    }${settings?.muted ? ' data-muted="true"' : ''}></script>`;
  }

  private generateIframeEmbed(url: string, settings?: any): string {
    const width = settings?.width || '100%';
    const height = settings?.height || '400px';
    return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
  }

  private generateReactEmbed(hash: string, settings?: any): string {
    return `import { NexusUgc } from '@nexus/react-embed';

<NexusUgc
  id="${hash}"${settings?.autoplay ? '\n  autoplay' : ''}${settings?.muted ? '\n  muted' : ''}
/>`;
  }

  private generateVueEmbed(hash: string, settings?: any): string {
    return `<template>
  <nexus-ugc id="${hash}"${settings?.autoplay ? ' autoplay' : ''}${settings?.muted ? ' muted' : ''} />
</template>

<script>
import { NexusUgc } from '@nexus/vue-embed';
export default { components: { NexusUgc } }
</script>`;
  }

  private generateWebComponentEmbed(hash: string, settings?: any): string {
    return `<script type="module" src="${this.baseUrl}/wc/nexus-ugc.js"></script>
<nexus-ugc id="${hash}"${settings?.autoplay ? ' autoplay' : ''}${settings?.muted ? ' muted' : ''}></nexus-ugc>`;
  }

  private generateAmpEmbed(url: string, settings?: any): string {
    const width = settings?.width || '400';
    const height = settings?.height || '300';
    return `<amp-iframe
  width="${width}"
  height="${height}"
  layout="responsive"
  sandbox="allow-scripts allow-same-origin"
  src="${url}">
</amp-iframe>`;
  }
}

export const ugcActivationService = new UgcActivationService();
