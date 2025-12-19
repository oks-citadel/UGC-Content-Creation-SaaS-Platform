import prisma from '../config/database';
import logger from '../config/logger';
import config from '../config';
import { AttributionEventType, AttributionModelType } from '@prisma/client';

interface TrackEventData {
  type: AttributionEventType;
  content_id?: string;
  product_id?: string;
  gallery_id?: string;
  order_id?: string;
  revenue?: number;
  quantity?: number;
  session_id?: string;
  user_id?: string;
  customer_id?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  user_agent?: string;
  ip_address?: string;
  device_type?: string;
  metadata?: any;
  tenant_id: string;
}

interface AttributionReport {
  period: { start: Date; end: Date };
  model_type: AttributionModelType;
  total_revenue: number;
  total_orders: number;
  content_attribution: Array<{
    content_id: string;
    revenue: number;
    orders: number;
    attribution_value: number;
    percentage: number;
  }>;
  product_attribution: Array<{
    product_id: string;
    product_name: string;
    revenue: number;
    orders: number;
    views: number;
    clicks: number;
    conversion_rate: number;
  }>;
  channel_attribution: Array<{
    channel: string;
    revenue: number;
    orders: number;
    attribution_value: number;
  }>;
}

interface ROIReport {
  id: string;
  name?: string;
  total_revenue: number;
  total_orders: number;
  total_views: number;
  total_clicks: number;
  conversion_rate: number;
  average_order_value: number;
  roi: number;
}

export class AttributionService {
  /**
   * Track an attribution event
   */
  async trackEvent(data: TrackEventData): Promise<any> {
    try {
      const event = await prisma.attributionEvent.create({
        data,
      });

      logger.info(`Attribution event tracked: ${event.type} - ${event.id}`);

      // Update real-time counters if enabled
      if (config.features.enableRealTimeAttribution) {
        await this.updateRealTimeCounters(data);
      }

      return event;
    } catch (error) {
      logger.error('Failed to track attribution event:', error);
      throw error;
    }
  }

  /**
   * Update real-time counters for galleries
   */
  private async updateRealTimeCounters(data: TrackEventData): Promise<void> {
    if (!data.gallery_id) return;

    try {
      const updateData: any = {};

      switch (data.type) {
        case 'view':
          updateData.view_count = { increment: 1 };
          break;
        case 'click':
          updateData.click_count = { increment: 1 };
          break;
        case 'purchase':
          updateData.conversion_count = { increment: 1 };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.shoppableGallery.update({
          where: { id: data.gallery_id },
          data: updateData,
        });
      }
    } catch (error) {
      logger.warn('Failed to update real-time counters:', error);
    }
  }

  /**
   * Calculate attribution based on model type
   */
  async calculateAttribution(
    tenantId: string,
    modelType: AttributionModelType,
    startDate: Date,
    endDate: Date
  ): Promise<AttributionReport> {
    try {
      // Get orders in the period
      const orders = await prisma.order.findMany({
        where: {
          tenant_id: tenantId,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed',
        },
        include: {
          attribution_events: true,
        },
      });

      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.total.toString()),
        0
      );
      const totalOrders = orders.length;

      // Calculate attribution based on model
      const contentAttribution = await this.calculateContentAttribution(
        orders,
        modelType,
        tenantId
      );

      const productAttribution = await this.calculateProductAttribution(
        tenantId,
        startDate,
        endDate
      );

      const channelAttribution = await this.calculateChannelAttribution(
        orders,
        modelType
      );

      return {
        period: { start: startDate, end: endDate },
        model_type: modelType,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        content_attribution: contentAttribution.map((item) => ({
          ...item,
          percentage: totalRevenue > 0 ? (item.attribution_value / totalRevenue) * 100 : 0,
        })),
        product_attribution: productAttribution,
        channel_attribution: channelAttribution,
      };
    } catch (error) {
      logger.error('Failed to calculate attribution:', error);
      throw error;
    }
  }

  /**
   * Calculate content attribution
   */
  private async calculateContentAttribution(
    orders: any[],
    modelType: AttributionModelType,
    tenantId: string
  ): Promise<Array<{
    content_id: string;
    revenue: number;
    orders: number;
    attribution_value: number;
  }>> {
    const contentMap = new Map<string, { revenue: number; orders: number; value: number }>();

    for (const order of orders) {
      const orderRevenue = parseFloat(order.total.toString());

      // Get all touchpoints for this order (session)
      const touchpoints = await prisma.attributionEvent.findMany({
        where: {
          tenant_id: tenantId,
          session_id: order.attribution_events[0]?.session_id,
          content_id: { not: null },
          created_at: {
            lte: order.created_at,
          },
        },
        orderBy: { created_at: 'asc' },
      });

      if (touchpoints.length === 0) continue;

      // Apply attribution model
      const attributionWeights = this.calculateWeights(touchpoints.length, modelType);

      touchpoints.forEach((touchpoint, index) => {
        const contentId = touchpoint.content_id!;
        const weight = attributionWeights[index];
        const attributedRevenue = orderRevenue * weight;

        const existing = contentMap.get(contentId) || {
          revenue: 0,
          orders: 0,
          value: 0,
        };

        contentMap.set(contentId, {
          revenue: existing.revenue + orderRevenue,
          orders: existing.orders + 1,
          value: existing.value + attributedRevenue,
        });
      });
    }

    return Array.from(contentMap.entries())
      .map(([content_id, data]) => ({
        content_id,
        revenue: data.revenue,
        orders: data.orders,
        attribution_value: data.value,
      }))
      .sort((a, b) => b.attribution_value - a.attribution_value);
  }

  /**
   * Calculate attribution weights based on model type
   */
  private calculateWeights(touchpointCount: number, modelType: AttributionModelType): number[] {
    const weights = new Array(touchpointCount).fill(0);

    switch (modelType) {
      case 'first_touch':
        weights[0] = 1;
        break;

      case 'last_touch':
        weights[touchpointCount - 1] = 1;
        break;

      case 'linear':
        weights.fill(1 / touchpointCount);
        break;

      case 'time_decay':
        // Exponential decay with half-life of 7 days
        const halfLife = 7;
        let total = 0;
        for (let i = 0; i < touchpointCount; i++) {
          const daysAgo = touchpointCount - i - 1;
          weights[i] = Math.pow(0.5, daysAgo / halfLife);
          total += weights[i];
        }
        // Normalize
        weights.forEach((_, i) => {
          weights[i] /= total;
        });
        break;

      case 'position_based':
      case 'u_shaped':
        // 40% to first, 40% to last, 20% distributed among middle
        if (touchpointCount === 1) {
          weights[0] = 1;
        } else if (touchpointCount === 2) {
          weights[0] = 0.5;
          weights[1] = 0.5;
        } else {
          weights[0] = 0.4;
          weights[touchpointCount - 1] = 0.4;
          const middleWeight = 0.2 / (touchpointCount - 2);
          for (let i = 1; i < touchpointCount - 1; i++) {
            weights[i] = middleWeight;
          }
        }
        break;

      default:
        weights.fill(1 / touchpointCount);
    }

    return weights;
  }

  /**
   * Calculate product attribution
   */
  private async calculateProductAttribution(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    product_id: string;
    product_name: string;
    revenue: number;
    orders: number;
    views: number;
    clicks: number;
    conversion_rate: number;
  }>> {
    const dateFilter = {
      gte: startDate,
      lte: endDate,
    };

    // Get product stats
    const productIds = await prisma.product.findMany({
      where: { tenant_id: tenantId },
      select: { id: true, name: true },
    });

    const results = await Promise.all(
      productIds.map(async (product) => {
        const views = await prisma.attributionEvent.count({
          where: {
            product_id: product.id,
            type: 'view',
            created_at: dateFilter,
          },
        });

        const clicks = await prisma.attributionEvent.count({
          where: {
            product_id: product.id,
            type: 'click',
            created_at: dateFilter,
          },
        });

        const purchases = await prisma.attributionEvent.findMany({
          where: {
            product_id: product.id,
            type: 'purchase',
            created_at: dateFilter,
          },
        });

        const revenue = purchases.reduce(
          (sum, event) => sum + parseFloat(event.revenue?.toString() || '0'),
          0
        );

        return {
          product_id: product.id,
          product_name: product.name,
          revenue,
          orders: purchases.length,
          views,
          clicks,
          conversion_rate: views > 0 ? (purchases.length / views) * 100 : 0,
        };
      })
    );

    return results
      .filter((r) => r.views > 0 || r.clicks > 0 || r.orders > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Calculate channel attribution
   */
  private async calculateChannelAttribution(
    orders: any[],
    modelType: AttributionModelType
  ): Promise<Array<{
    channel: string;
    revenue: number;
    orders: number;
    attribution_value: number;
  }>> {
    const channelMap = new Map<string, { revenue: number; orders: number; value: number }>();

    for (const order of orders) {
      const orderRevenue = parseFloat(order.total.toString());

      // Determine channel from UTM parameters or referrer
      const firstEvent = order.attribution_events[0];
      const channel = firstEvent?.utm_medium || firstEvent?.utm_source || 'direct';

      const existing = channelMap.get(channel) || {
        revenue: 0,
        orders: 0,
        value: 0,
      };

      channelMap.set(channel, {
        revenue: existing.revenue + orderRevenue,
        orders: existing.orders + 1,
        value: existing.value + orderRevenue, // Full attribution for now
      });
    }

    return Array.from(channelMap.entries())
      .map(([channel, data]) => ({
        channel,
        revenue: data.revenue,
        orders: data.orders,
        attribution_value: data.value,
      }))
      .sort((a, b) => b.attribution_value - a.attribution_value);
  }

  /**
   * Get attribution report
   */
  async getAttributionReport(
    tenantId: string,
    options: {
      start_date?: Date;
      end_date?: Date;
      model_type?: AttributionModelType;
    } = {}
  ): Promise<AttributionReport> {
    try {
      const endDate = options.end_date || new Date();
      const startDate = options.start_date || new Date(endDate.getTime() - config.attribution.windowDays * 24 * 60 * 60 * 1000);
      const modelType = options.model_type || config.attribution.defaultModel as AttributionModelType;

      return await this.calculateAttribution(tenantId, modelType, startDate, endDate);
    } catch (error) {
      logger.error('Failed to get attribution report:', error);
      throw error;
    }
  }

  /**
   * Get content ROI
   */
  async getContentROI(
    contentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ROIReport> {
    try {
      const dateFilter = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };

      const views = await prisma.attributionEvent.count({
        where: {
          content_id: contentId,
          type: 'view',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      const clicks = await prisma.attributionEvent.count({
        where: {
          content_id: contentId,
          type: 'click',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      const purchases = await prisma.attributionEvent.findMany({
        where: {
          content_id: contentId,
          type: 'purchase',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      const totalRevenue = purchases.reduce(
        (sum, event) => sum + parseFloat(event.revenue?.toString() || '0'),
        0
      );

      const totalOrders = purchases.length;

      return {
        id: contentId,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_views: views,
        total_clicks: clicks,
        conversion_rate: views > 0 ? (totalOrders / views) * 100 : 0,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        roi: totalRevenue, // Simplified ROI (would need cost data for real ROI)
      };
    } catch (error) {
      logger.error(`Failed to get ROI for content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Get creator ROI (aggregated from their content)
   */
  async getCreatorROI(
    creatorId: string,
    contentIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<ROIReport> {
    try {
      const dateFilter = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };

      const views = await prisma.attributionEvent.count({
        where: {
          content_id: { in: contentIds },
          type: 'view',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      const clicks = await prisma.attributionEvent.count({
        where: {
          content_id: { in: contentIds },
          type: 'click',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      const purchases = await prisma.attributionEvent.findMany({
        where: {
          content_id: { in: contentIds },
          type: 'purchase',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      const totalRevenue = purchases.reduce(
        (sum, event) => sum + parseFloat(event.revenue?.toString() || '0'),
        0
      );

      const totalOrders = purchases.length;

      return {
        id: creatorId,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_views: views,
        total_clicks: clicks,
        conversion_rate: views > 0 ? (totalOrders / views) * 100 : 0,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        roi: totalRevenue,
      };
    } catch (error) {
      logger.error(`Failed to get ROI for creator ${creatorId}:`, error);
      throw error;
    }
  }
}

export default new AttributionService();
