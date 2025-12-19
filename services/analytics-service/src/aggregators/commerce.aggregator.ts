import metricsService from '../services/metrics.service';
import axios from 'axios';
import config from '../config';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export interface CommerceMetrics {
  productId?: string;
  storeId?: string;
  totalOrders: number;
  totalRevenue: number;
  totalUnits: number;
  averageOrderValue: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  returnRate: number;
  customerAcquisitionCost: number;
  lifetimeValue: number;
}

class CommerceAggregator {
  /**
   * Aggregate product metrics
   */
  async aggregateProductMetrics(
    productId: string,
    period: 'hourly' | 'daily' = 'daily'
  ) {
    try {
      const [productResponse, ordersResponse, analyticsResponse] = await Promise.all([
        axios.get(`${config.services.commerce}/api/products/${productId}`, {
          timeout: 5000,
        }),
        axios.get(`${config.services.commerce}/api/products/${productId}/orders`, {
          timeout: 5000,
        }),
        axios.get(`${config.services.commerce}/api/products/${productId}/analytics`, {
          timeout: 5000,
        }),
      ]);

      const product = productResponse.data;
      const orders = ordersResponse.data.data || [];
      const analytics = analyticsResponse.data;

      const metrics = this.calculateProductMetrics(product, orders, analytics);

      await metricsService.recordMetrics({
        entityType: 'commerce',
        entityId: productId,
        metrics,
        period,
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to aggregate product metrics for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Aggregate store metrics
   */
  async aggregateStoreMetrics(storeId: string, period: 'hourly' | 'daily' = 'daily') {
    try {
      const [storeResponse, ordersResponse, productsResponse] = await Promise.all([
        axios.get(`${config.services.commerce}/api/stores/${storeId}`, {
          timeout: 5000,
        }),
        axios.get(`${config.services.commerce}/api/stores/${storeId}/orders`, {
          timeout: 5000,
        }),
        axios.get(`${config.services.commerce}/api/stores/${storeId}/products`, {
          timeout: 5000,
        }),
      ]);

      const store = storeResponse.data;
      const orders = ordersResponse.data.data || [];
      const products = productsResponse.data.data || [];

      const metrics = this.calculateStoreMetrics(store, orders, products);

      await metricsService.recordMetrics({
        entityType: 'commerce',
        entityId: `store:${storeId}`,
        metrics,
        period,
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to aggregate store metrics for ${storeId}:`, error);
      throw error;
    }
  }

  /**
   * Aggregate all products
   */
  async aggregateAllProducts(period: 'hourly' | 'daily' = 'daily') {
    try {
      const response = await axios.get(
        `${config.services.commerce}/api/products?status=active`,
        { timeout: 10000 }
      );

      const products = response.data.data || [];

      const results = await Promise.allSettled(
        products.map((product: any) =>
          this.aggregateProductMetrics(product.id, period)
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        total: products.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Failed to aggregate all products:', error);
      throw error;
    }
  }

  /**
   * Calculate revenue metrics
   */
  async calculateRevenueMetrics(entityId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    try {
      const response = await axios.get(
        `${config.services.commerce}/api/analytics/revenue?entityId=${entityId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { timeout: 5000 }
      );

      const revenueData = response.data;

      const metrics = {
        totalRevenue: revenueData.total || 0,
        averageDailyRevenue: revenueData.total / days || 0,
        growthRate: revenueData.growthRate || 0,
        topProducts: revenueData.topProducts || [],
        revenueByDay: revenueData.byDay || [],
      };

      await metricsService.recordMetrics({
        entityType: 'commerce',
        entityId: `${entityId}:revenue`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to calculate revenue metrics for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate customer metrics
   */
  async calculateCustomerMetrics(storeId: string) {
    try {
      const response = await axios.get(
        `${config.services.commerce}/api/stores/${storeId}/customers/analytics`,
        { timeout: 5000 }
      );

      const customerData = response.data;

      const metrics = {
        totalCustomers: customerData.total || 0,
        newCustomers: customerData.new || 0,
        returningCustomers: customerData.returning || 0,
        averageLifetimeValue: customerData.averageLTV || 0,
        customerAcquisitionCost: customerData.cac || 0,
        retentionRate: customerData.retentionRate || 0,
        churnRate: customerData.churnRate || 0,
      };

      await metricsService.recordMetrics({
        entityType: 'commerce',
        entityId: `store:${storeId}:customers`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(
        `Failed to calculate customer metrics for store ${storeId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Track attribution metrics
   */
  async trackAttributionMetrics(contentId: string) {
    try {
      const response = await axios.get(
        `${config.services.commerce}/api/attribution/content/${contentId}`,
        { timeout: 5000 }
      );

      const attributionData = response.data;

      const metrics = {
        totalOrders: attributionData.orders || 0,
        totalRevenue: attributionData.revenue || 0,
        totalCommission: attributionData.commission || 0,
        conversionRate: attributionData.conversionRate || 0,
        averageOrderValue: attributionData.averageOrderValue || 0,
        topProducts: attributionData.topProducts || [],
      };

      await metricsService.recordMetrics({
        entityType: 'commerce',
        entityId: `content:${contentId}:attribution`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(
        `Failed to track attribution metrics for content ${contentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Calculate inventory metrics
   */
  async calculateInventoryMetrics(productId: string) {
    try {
      const response = await axios.get(
        `${config.services.commerce}/api/products/${productId}/inventory`,
        { timeout: 5000 }
      );

      const inventory = response.data;

      const metrics = {
        currentStock: inventory.current || 0,
        reservedStock: inventory.reserved || 0,
        availableStock: inventory.available || 0,
        lowStockAlert: inventory.lowStockAlert || false,
        outOfStock: inventory.outOfStock || false,
        turnoverRate: inventory.turnoverRate || 0,
        daysOfSupply: inventory.daysOfSupply || 0,
      };

      await metricsService.recordMetrics({
        entityType: 'commerce',
        entityId: `product:${productId}:inventory`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(
        `Failed to calculate inventory metrics for product ${productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(
    storeId: string,
    days: number = 30,
    limit: number = 10
  ) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const topProducts = await metricsService.getTopPerformers(
      'commerce',
      'totalRevenue',
      {
        startDate,
        endDate,
        limit,
        order: 'desc',
      }
    );

    return topProducts;
  }

  /**
   * Calculate conversion funnel metrics
   */
  async calculateFunnelMetrics(storeId: string) {
    try {
      const response = await axios.get(
        `${config.services.commerce}/api/stores/${storeId}/funnel`,
        { timeout: 5000 }
      );

      const funnel = response.data;

      const metrics = {
        visitors: funnel.visitors || 0,
        productViews: funnel.productViews || 0,
        addToCarts: funnel.addToCarts || 0,
        checkoutInitiated: funnel.checkoutInitiated || 0,
        purchases: funnel.purchases || 0,
        viewToCartRate:
          funnel.productViews > 0
            ? (funnel.addToCarts / funnel.productViews) * 100
            : 0,
        cartToCheckoutRate:
          funnel.addToCarts > 0
            ? (funnel.checkoutInitiated / funnel.addToCarts) * 100
            : 0,
        checkoutTopurchaseRate:
          funnel.checkoutInitiated > 0
            ? (funnel.purchases / funnel.checkoutInitiated) * 100
            : 0,
        overallConversionRate:
          funnel.visitors > 0 ? (funnel.purchases / funnel.visitors) * 100 : 0,
      };

      await metricsService.recordMetrics({
        entityType: 'commerce',
        entityId: `store:${storeId}:funnel`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to calculate funnel metrics for store ${storeId}:`, error);
      throw error;
    }
  }

  // Helper methods

  private calculateProductMetrics(
    product: any,
    orders: any[],
    analytics: any
  ): CommerceMetrics {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalUnits = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const views = analytics.views || 0;
    const conversionRate = views > 0 ? (totalOrders / views) * 100 : 0;

    const cartAdds = analytics.cartAdds || 0;
    const cartAbandonmentRate =
      cartAdds > 0 ? ((cartAdds - totalOrders) / cartAdds) * 100 : 0;

    const returns = analytics.returns || 0;
    const returnRate = totalOrders > 0 ? (returns / totalOrders) * 100 : 0;

    const marketingSpend = analytics.marketingSpend || 0;
    const newCustomers = analytics.newCustomers || 0;
    const customerAcquisitionCost =
      newCustomers > 0 ? marketingSpend / newCustomers : 0;

    const lifetimeValue = analytics.lifetimeValue || 0;

    return {
      productId: product.id,
      totalOrders,
      totalRevenue,
      totalUnits,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(2)),
      cartAbandonmentRate: Number(cartAbandonmentRate.toFixed(2)),
      returnRate: Number(returnRate.toFixed(2)),
      customerAcquisitionCost: Number(customerAcquisitionCost.toFixed(2)),
      lifetimeValue: Number(lifetimeValue.toFixed(2)),
    };
  }

  private calculateStoreMetrics(
    store: any,
    orders: any[],
    products: any[]
  ): CommerceMetrics {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalUnits = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const activeProducts = products.filter((p) => p.status === 'active').length;

    return {
      storeId: store.id,
      totalOrders,
      totalRevenue,
      totalUnits,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      conversionRate: 0,
      cartAbandonmentRate: 0,
      returnRate: 0,
      customerAcquisitionCost: 0,
      lifetimeValue: 0,
    };
  }
}

export default new CommerceAggregator();
