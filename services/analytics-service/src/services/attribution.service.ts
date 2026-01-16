import { PrismaClient } from '.prisma/analytics-service-client';
import { subDays } from 'date-fns';
import _ from 'lodash';

const prisma = new PrismaClient();

// Attribution model types
export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based';

export interface TouchpointInput {
  visitorId: string;
  sessionId?: string;
  channel: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage?: string;
  referrer?: string;
  deviceType?: string;
  browser?: string;
  country?: string;
  region?: string;
  city?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface ConversionInput {
  visitorId: string;
  conversionType: string;
  value?: number;
  currency?: string;
  orderId?: string;
  productId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  lookbackDays?: number;
}

export interface AttributionQuery {
  startDate: Date;
  endDate: Date;
  model?: AttributionModel;
  channel?: string;
  campaign?: string;
  groupBy?: 'channel' | 'source' | 'campaign' | 'medium';
}

export interface AttributionReportOptions {
  startDate: Date;
  endDate: Date;
  models?: AttributionModel[];
  groupBy?: 'channel' | 'source' | 'campaign' | 'medium';
  includeDetails?: boolean;
}

class AttributionService {
  /**
   * Available attribution models
   */
  getModels(): { id: AttributionModel; name: string; description: string }[] {
    return [
      {
        id: 'first_touch',
        name: 'First Touch',
        description: '100% credit to the first touchpoint in the customer journey',
      },
      {
        id: 'last_touch',
        name: 'Last Touch',
        description: '100% credit to the last touchpoint before conversion',
      },
      {
        id: 'linear',
        name: 'Linear',
        description: 'Equal credit distributed across all touchpoints',
      },
      {
        id: 'time_decay',
        name: 'Time Decay',
        description: 'More credit to touchpoints closer to conversion (7-day half-life)',
      },
      {
        id: 'position_based',
        name: 'Position Based (U-Shaped)',
        description: '40% to first, 40% to last, 20% distributed to middle touchpoints',
      },
    ];
  }

  /**
   * Record a touchpoint
   */
  async recordTouchpoint(input: TouchpointInput) {
    const touchpoint = await prisma.touchpoint.create({
      data: {
        visitorId: input.visitorId,
        sessionId: input.sessionId,
        channel: input.channel,
        source: input.source,
        medium: input.medium,
        campaign: input.campaign,
        content: input.content,
        term: input.term,
        landingPage: input.landingPage,
        referrer: input.referrer,
        deviceType: input.deviceType,
        browser: input.browser,
        country: input.country,
        region: input.region,
        city: input.city,
        metadata: input.metadata,
        timestamp: input.timestamp || new Date(),
      },
    });

    return touchpoint;
  }

  /**
   * Get touchpoints for a visitor
   */
  async getTouchpoints(
    visitorId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number }
  ) {
    const touchpoints = await prisma.touchpoint.findMany({
      where: {
        visitorId,
        ...(options?.startDate && {
          timestamp: {
            gte: options.startDate,
            ...(options?.endDate && { lte: options.endDate }),
          },
        }),
      },
      orderBy: { timestamp: 'asc' },
      ...(options?.limit && { take: options.limit }),
    });

    return touchpoints;
  }

  /**
   * Query touchpoints with filters
   */
  async queryTouchpoints(query: {
    startDate: Date;
    endDate: Date;
    channel?: string;
    campaign?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    const [touchpoints, total] = await Promise.all([
      prisma.touchpoint.findMany({
        where: {
          timestamp: {
            gte: query.startDate,
            lte: query.endDate,
          },
          ...(query.channel && { channel: query.channel }),
          ...(query.campaign && { campaign: query.campaign }),
          ...(query.source && { source: query.source }),
        },
        orderBy: { timestamp: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
      }),
      prisma.touchpoint.count({
        where: {
          timestamp: {
            gte: query.startDate,
            lte: query.endDate,
          },
          ...(query.channel && { channel: query.channel }),
          ...(query.campaign && { campaign: query.campaign }),
          ...(query.source && { source: query.source }),
        },
      }),
    ]);

    return { touchpoints, total };
  }

  /**
   * Record a conversion and link touchpoints
   */
  async recordConversion(input: ConversionInput) {
    const lookbackDays = input.lookbackDays || 30;
    const lookbackDate = subDays(input.timestamp || new Date(), lookbackDays);

    // Find all touchpoints for this visitor within lookback window
    const touchpoints = await prisma.touchpoint.findMany({
      where: {
        visitorId: input.visitorId,
        timestamp: {
          gte: lookbackDate,
          lte: input.timestamp || new Date(),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Create conversion
    const conversion = await prisma.conversion.create({
      data: {
        visitorId: input.visitorId,
        conversionType: input.conversionType,
        value: input.value || 0,
        currency: input.currency || 'USD',
        orderId: input.orderId,
        productId: input.productId,
        metadata: input.metadata,
        timestamp: input.timestamp || new Date(),
      },
    });

    // Link touchpoints to conversion
    if (touchpoints.length > 0) {
      await prisma.conversionTouchpoint.createMany({
        data: touchpoints.map((tp, index) => ({
          conversionId: conversion.id,
          touchpointId: tp.id,
          position: index + 1,
        })),
      });
    }

    return {
      conversion,
      touchpointCount: touchpoints.length,
    };
  }

  /**
   * Calculate attribution for a conversion
   */
  async calculateAttribution(
    conversionId: string,
    models: AttributionModel[] = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based']
  ) {
    // Get conversion with touchpoints
    const conversion = await prisma.conversion.findUnique({
      where: { id: conversionId },
      include: {
        touchpoints: {
          include: { touchpoint: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!conversion) {
      throw new Error('Conversion not found');
    }

    const touchpoints = conversion.touchpoints.map((ct) => ({
      ...ct.touchpoint,
      position: ct.position,
    }));

    if (touchpoints.length === 0) {
      return { conversion, results: [] };
    }

    const results: any[] = [];

    for (const model of models) {
      const attributions = this.applyModel(model, touchpoints, conversion.value);

      for (const attr of attributions) {
        results.push({
          conversionId: conversion.id,
          model,
          channel: attr.channel,
          source: attr.source,
          medium: attr.medium,
          campaign: attr.campaign,
          touchpointId: attr.touchpointId,
          attributedValue: attr.attributedValue,
          attributedPct: attr.attributedPct,
          position: attr.position,
          totalTouchpoints: touchpoints.length,
        });
      }
    }

    // Store attribution results
    await prisma.attributionResult.createMany({
      data: results,
    });

    return { conversion, results };
  }

  /**
   * Apply attribution model to touchpoints
   */
  private applyModel(
    model: AttributionModel,
    touchpoints: any[],
    conversionValue: number
  ) {
    switch (model) {
      case 'first_touch':
        return this.firstTouchAttribution(touchpoints, conversionValue);
      case 'last_touch':
        return this.lastTouchAttribution(touchpoints, conversionValue);
      case 'linear':
        return this.linearAttribution(touchpoints, conversionValue);
      case 'time_decay':
        return this.timeDecayAttribution(touchpoints, conversionValue);
      case 'position_based':
        return this.positionBasedAttribution(touchpoints, conversionValue);
      default:
        return this.linearAttribution(touchpoints, conversionValue);
    }
  }

  /**
   * First Touch Attribution - 100% credit to first touchpoint
   */
  private firstTouchAttribution(touchpoints: any[], conversionValue: number) {
    if (touchpoints.length === 0) return [];

    const first = touchpoints[0];
    return [
      {
        touchpointId: first.id,
        channel: first.channel,
        source: first.source,
        medium: first.medium,
        campaign: first.campaign,
        position: 1,
        attributedValue: conversionValue,
        attributedPct: 100,
      },
    ];
  }

  /**
   * Last Touch Attribution - 100% credit to last touchpoint
   */
  private lastTouchAttribution(touchpoints: any[], conversionValue: number) {
    if (touchpoints.length === 0) return [];

    const last = touchpoints[touchpoints.length - 1];
    return [
      {
        touchpointId: last.id,
        channel: last.channel,
        source: last.source,
        medium: last.medium,
        campaign: last.campaign,
        position: touchpoints.length,
        attributedValue: conversionValue,
        attributedPct: 100,
      },
    ];
  }

  /**
   * Linear Attribution - Equal credit to all touchpoints
   */
  private linearAttribution(touchpoints: any[], conversionValue: number) {
    if (touchpoints.length === 0) return [];

    const creditPerTouch = conversionValue / touchpoints.length;
    const pctPerTouch = 100 / touchpoints.length;

    return touchpoints.map((tp, index) => ({
      touchpointId: tp.id,
      channel: tp.channel,
      source: tp.source,
      medium: tp.medium,
      campaign: tp.campaign,
      position: index + 1,
      attributedValue: creditPerTouch,
      attributedPct: pctPerTouch,
    }));
  }

  /**
   * Time Decay Attribution - More credit to recent touchpoints (7-day half-life)
   */
  private timeDecayAttribution(touchpoints: any[], conversionValue: number) {
    if (touchpoints.length === 0) return [];

    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const lastTimestamp = new Date(touchpoints[touchpoints.length - 1].timestamp).getTime();

    // Calculate decay weights
    const weights = touchpoints.map((tp) => {
      const tpTime = new Date(tp.timestamp).getTime();
      const daysDiff = (lastTimestamp - tpTime) / halfLife;
      return Math.pow(0.5, daysDiff);
    });

    const totalWeight = _.sum(weights);

    return touchpoints.map((tp, index) => {
      const weight = weights[index];
      const pct = (weight / totalWeight) * 100;

      return {
        touchpointId: tp.id,
        channel: tp.channel,
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        position: index + 1,
        attributedValue: (weight / totalWeight) * conversionValue,
        attributedPct: pct,
      };
    });
  }

  /**
   * Position Based Attribution (U-Shaped) - 40% first, 40% last, 20% middle
   */
  private positionBasedAttribution(touchpoints: any[], conversionValue: number) {
    if (touchpoints.length === 0) return [];

    if (touchpoints.length === 1) {
      return this.firstTouchAttribution(touchpoints, conversionValue);
    }

    if (touchpoints.length === 2) {
      // Split 50/50 between first and last
      return [
        {
          touchpointId: touchpoints[0].id,
          channel: touchpoints[0].channel,
          source: touchpoints[0].source,
          medium: touchpoints[0].medium,
          campaign: touchpoints[0].campaign,
          position: 1,
          attributedValue: conversionValue * 0.5,
          attributedPct: 50,
        },
        {
          touchpointId: touchpoints[1].id,
          channel: touchpoints[1].channel,
          source: touchpoints[1].source,
          medium: touchpoints[1].medium,
          campaign: touchpoints[1].campaign,
          position: 2,
          attributedValue: conversionValue * 0.5,
          attributedPct: 50,
        },
      ];
    }

    const firstCredit = 0.4;
    const lastCredit = 0.4;
    const middleCredit = 0.2;
    const middleCount = touchpoints.length - 2;
    const middleCreditEach = middleCredit / middleCount;

    return touchpoints.map((tp, index) => {
      let credit: number;
      let pct: number;

      if (index === 0) {
        credit = firstCredit;
        pct = 40;
      } else if (index === touchpoints.length - 1) {
        credit = lastCredit;
        pct = 40;
      } else {
        credit = middleCreditEach;
        pct = (middleCredit / middleCount) * 100;
      }

      return {
        touchpointId: tp.id,
        channel: tp.channel,
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        position: index + 1,
        attributedValue: credit * conversionValue,
        attributedPct: pct,
      };
    });
  }

  /**
   * Get attribution report
   */
  async getReport(options: AttributionReportOptions) {
    const models = options.models || ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'];
    const groupBy = options.groupBy || 'channel';

    const results = await prisma.attributionResult.findMany({
      where: {
        model: { in: models },
        calculatedAt: {
          gte: options.startDate,
          lte: options.endDate,
        },
      },
      include: options.includeDetails
        ? { conversion: true }
        : undefined,
    });

    // Group results
    const report: Record<string, Record<string, { value: number; conversions: number; pct: number }>> = {};

    for (const model of models) {
      const modelResults = results.filter((r) => r.model === model);
      const grouped = _.groupBy(modelResults, groupBy);

      report[model] = {};
      const totalValue = _.sumBy(modelResults, 'attributedValue');

      for (const [key, items] of Object.entries(grouped)) {
        const value = _.sumBy(items, 'attributedValue');
        report[model][key || 'unknown'] = {
          value,
          conversions: new Set(items.map((i) => i.conversionId)).size,
          pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
        };
      }
    }

    return {
      period: { start: options.startDate, end: options.endDate },
      groupBy,
      models,
      data: report,
      summary: {
        totalConversions: new Set(results.map((r) => r.conversionId)).size,
        totalValue: _.sumBy(results.filter((r) => r.model === models[0]), 'attributedValue'),
      },
    };
  }

  /**
   * Get channel performance comparison across models
   */
  async getChannelComparison(options: { startDate: Date; endDate: Date }) {
    const models: AttributionModel[] = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'];

    const results = await prisma.attributionResult.findMany({
      where: {
        calculatedAt: {
          gte: options.startDate,
          lte: options.endDate,
        },
      },
    });

    // Get unique channels
    const channels = [...new Set(results.map((r) => r.channel))];

    const comparison: Record<string, Record<string, number>> = {};

    for (const channel of channels) {
      comparison[channel] = {};
      for (const model of models) {
        const channelModelResults = results.filter(
          (r) => r.channel === channel && r.model === model
        );
        comparison[channel][model] = _.sumBy(channelModelResults, 'attributedValue');
      }
    }

    return {
      period: { start: options.startDate, end: options.endDate },
      channels,
      models,
      data: comparison,
    };
  }

  /**
   * Get customer journey for a visitor
   */
  async getCustomerJourney(visitorId: string) {
    const [touchpoints, conversions] = await Promise.all([
      prisma.touchpoint.findMany({
        where: { visitorId },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.conversion.findMany({
        where: { visitorId },
        include: {
          touchpoints: {
            include: { touchpoint: true },
            orderBy: { position: 'asc' },
          },
          attributionResults: true,
        },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    return {
      visitorId,
      touchpoints,
      conversions,
      summary: {
        totalTouchpoints: touchpoints.length,
        totalConversions: conversions.length,
        totalValue: _.sumBy(conversions, 'value'),
        firstTouch: touchpoints[0]?.timestamp,
        lastTouch: touchpoints[touchpoints.length - 1]?.timestamp,
      },
    };
  }
}

export default new AttributionService();
