import { PrismaClient, UsageType, UsageRecord } from '.prisma/billing-service-client';
import logger from '../utils/logger';
import subscriptionService from './subscription.service';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const prisma = new PrismaClient();

export class UsageService {
  async recordUsage(params: {
    userId: string;
    subscriptionId: string;
    type: UsageType;
    quantity: number;
    unit?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<UsageRecord> {
    try {
      const now = new Date();
      const billingPeriodStart = startOfMonth(now);
      const billingPeriodEnd = endOfMonth(now);

      const usageRecord = await prisma.usageRecord.create({
        data: {
          subscriptionId: params.subscriptionId,
          userId: params.userId,
          type: params.type,
          quantity: params.quantity,
          unit: params.unit || 'unit',
          description: params.description,
          billingPeriodStart,
          billingPeriodEnd,
          metadata: params.metadata,
        },
      });

      // Update entitlement usage
      await this.updateEntitlementUsage(
        params.subscriptionId,
        params.type,
        params.quantity
      );

      logger.info('Usage recorded', {
        userId: params.userId,
        type: params.type,
        quantity: params.quantity,
      });

      return usageRecord;
    } catch (error) {
      logger.error('Failed to record usage', { error, params });
      throw error;
    }
  }

  async getUsage(params: {
    userId: string;
    subscriptionId?: string;
    type?: UsageType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UsageRecord[]> {
    try {
      const where: any = {
        userId: params.userId,
      };

      if (params.subscriptionId) {
        where.subscriptionId = params.subscriptionId;
      }

      if (params.type) {
        where.type = params.type;
      }

      if (params.startDate || params.endDate) {
        where.recordedAt = {};
        if (params.startDate) {
          where.recordedAt.gte = params.startDate;
        }
        if (params.endDate) {
          where.recordedAt.lte = params.endDate;
        }
      }

      const usageRecords = await prisma.usageRecord.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
      });

      return usageRecords;
    } catch (error) {
      logger.error('Failed to get usage', { error, params });
      throw error;
    }
  }

  async getUsageSummary(params: {
    userId: string;
    subscriptionId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Record<UsageType, { quantity: number; unit: string }>> {
    try {
      const startDate = params.startDate || startOfMonth(new Date());
      const endDate = params.endDate || endOfMonth(new Date());

      const usageRecords = await this.getUsage({
        userId: params.userId,
        subscriptionId: params.subscriptionId,
        startDate,
        endDate,
      });

      const summary: Record<string, { quantity: number; unit: string }> = {};

      for (const record of usageRecords) {
        if (!summary[record.type]) {
          summary[record.type] = {
            quantity: 0,
            unit: record.unit,
          };
        }

        summary[record.type].quantity += Number(record.quantity);
      }

      return summary as Record<UsageType, { quantity: number; unit: string }>;
    } catch (error) {
      logger.error('Failed to get usage summary', { error, params });
      throw error;
    }
  }

  async calculateOverage(
    userId: string,
    subscriptionId: string
  ): Promise<Record<string, { overage: number; cost: number }>> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: true,
          entitlements: true,
        },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const usageSummary = await this.getUsageSummary({
        userId,
        subscriptionId,
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
      });

      const overages: Record<string, { overage: number; cost: number }> = {};

      for (const entitlement of subscription.entitlements) {
        if (entitlement.limit === null) {
          continue; // Unlimited
        }

        const used = Number(entitlement.used);
        const limit = Number(entitlement.limit);

        if (used > limit) {
          const overage = used - limit;
          const cost = this.calculateOverageCost(
            entitlement.feature,
            overage,
            subscription.plan.metadata as any
          );

          overages[entitlement.feature] = {
            overage,
            cost,
          };
        }
      }

      return overages;
    } catch (error) {
      logger.error('Failed to calculate overage', { error, userId, subscriptionId });
      throw error;
    }
  }

  async billOverage(
    userId: string,
    subscriptionId: string
  ): Promise<{ total: number; items: any[] }> {
    try {
      const overages = await this.calculateOverage(userId, subscriptionId);

      let total = 0;
      const items: any[] = [];

      for (const [feature, data] of Object.entries(overages)) {
        if (data.cost > 0) {
          total += data.cost;
          items.push({
            feature,
            overage: data.overage,
            cost: data.cost,
          });
        }
      }

      if (total > 0) {
        logger.info('Overage billing calculated', {
          userId,
          subscriptionId,
          total,
          items,
        });
      }

      return { total, items };
    } catch (error) {
      logger.error('Failed to bill overage', { error, userId, subscriptionId });
      throw error;
    }
  }

  async resetMonthlyUsage(subscriptionId: string): Promise<void> {
    try {
      await prisma.entitlement.updateMany({
        where: {
          subscriptionId,
          resetPeriod: 'monthly',
        },
        data: {
          used: 0,
          lastResetAt: new Date(),
          nextResetAt: endOfMonth(new Date()),
        },
      });

      logger.info('Monthly usage reset', { subscriptionId });
    } catch (error) {
      logger.error('Failed to reset monthly usage', { error, subscriptionId });
      throw error;
    }
  }

  async getUsageHistory(
    userId: string,
    type: UsageType,
    months: number = 6
  ): Promise<Record<string, number>> {
    try {
      const history: Record<string, number> = {};

      for (let i = 0; i < months; i++) {
        const date = subMonths(new Date(), i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);

        const usageRecords = await this.getUsage({
          userId,
          type,
          startDate,
          endDate,
        });

        const total = usageRecords.reduce(
          (sum, record) => sum + Number(record.quantity),
          0
        );

        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        history[monthKey] = total;
      }

      return history;
    } catch (error) {
      logger.error('Failed to get usage history', { error, userId, type });
      throw error;
    }
  }

  private async updateEntitlementUsage(
    subscriptionId: string,
    type: UsageType,
    quantity: number
  ): Promise<void> {
    try {
      const entitlement = await prisma.entitlement.findUnique({
        where: {
          subscriptionId_feature: {
            subscriptionId,
            feature: type,
          },
        },
      });

      if (entitlement) {
        await prisma.entitlement.update({
          where: { id: entitlement.id },
          data: {
            used: {
              increment: quantity,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Failed to update entitlement usage', {
        error,
        subscriptionId,
        type,
      });
      // Don't throw - this is not critical
    }
  }

  private calculateOverageCost(
    feature: string,
    overage: number,
    metadata: any
  ): number {
    // Default overage rates (can be customized per plan via metadata)
    const defaultRates: Record<string, number> = {
      [UsageType.VIEWS]: 0.001, // $0.001 per view
      [UsageType.RENDERS]: 0.01, // $0.01 per render
      [UsageType.AI_GENERATIONS]: 0.05, // $0.05 per AI generation
      [UsageType.WORKFLOW_RUNS]: 0.02, // $0.02 per workflow run
      [UsageType.STORAGE_GB]: 0.10, // $0.10 per GB
      [UsageType.BANDWIDTH_GB]: 0.05, // $0.05 per GB
      [UsageType.API_CALLS]: 0.0001, // $0.0001 per API call
    };

    const rates = metadata?.overageRates || defaultRates;
    const rate = rates[feature] || 0;

    return overage * rate;
  }
}

export default new UsageService();
