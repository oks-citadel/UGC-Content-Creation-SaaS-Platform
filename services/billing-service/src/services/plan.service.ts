import { PrismaClient, Plan, PlanName } from '.prisma/billing-service-client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class PlanService {
  async getAllPlans(includeInactive: boolean = false): Promise<Plan[]> {
    try {
      const where = includeInactive ? {} : { isActive: true };

      const plans = await prisma.plan.findMany({
        where,
        orderBy: { price: 'asc' },
      });

      return plans;
    } catch (error) {
      logger.error('Failed to get plans', { error });
      throw error;
    }
  }

  async getPlanByName(name: PlanName): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { name },
      });

      return plan;
    } catch (error) {
      logger.error('Failed to get plan by name', { error, name });
      throw error;
    }
  }

  async getPlanById(id: string): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id },
      });

      return plan;
    } catch (error) {
      logger.error('Failed to get plan by id', { error, id });
      throw error;
    }
  }

  async comparePlans(
    currentPlanName: PlanName,
    targetPlanName: PlanName
  ): Promise<{
    isUpgrade: boolean;
    isDowngrade: boolean;
    priceDifference: number;
    featureChanges: {
      added: string[];
      removed: string[];
    };
  }> {
    try {
      const [currentPlan, targetPlan] = await Promise.all([
        this.getPlanByName(currentPlanName),
        this.getPlanByName(targetPlanName),
      ]);

      if (!currentPlan || !targetPlan) {
        throw new Error('Plan not found');
      }

      const currentPrice = Number(currentPlan.price);
      const targetPrice = Number(targetPlan.price);

      const isUpgrade = targetPrice > currentPrice;
      const isDowngrade = targetPrice < currentPrice;
      const priceDifference = targetPrice - currentPrice;

      const currentFeatures = currentPlan.features as string[];
      const targetFeatures = targetPlan.features as string[];

      const added = targetFeatures.filter((f) => !currentFeatures.includes(f));
      const removed = currentFeatures.filter((f) => !targetFeatures.includes(f));

      return {
        isUpgrade,
        isDowngrade,
        priceDifference,
        featureChanges: {
          added,
          removed,
        },
      };
    } catch (error) {
      logger.error('Failed to compare plans', {
        error,
        currentPlanName,
        targetPlanName,
      });
      throw error;
    }
  }

  async getPlanRecommendation(
    currentUsage: Record<string, number>
  ): Promise<{ recommendedPlan: Plan; reasons: string[] }> {
    try {
      const plans = await this.getAllPlans();
      const reasons: string[] = [];

      // Find the most suitable plan based on usage
      let recommendedPlan = plans[0]; // Default to Free

      for (const plan of plans) {
        const limits = plan.limits as any;
        let isWithinLimits = true;

        for (const [usageType, usage] of Object.entries(currentUsage)) {
          const limit = limits[usageType];

          // If limit is null (unlimited), this plan is suitable
          if (limit === null) {
            continue;
          }

          // If usage exceeds limit, this plan is not suitable
          if (usage > limit) {
            isWithinLimits = false;
            break;
          }
        }

        if (isWithinLimits) {
          recommendedPlan = plan;
          break;
        }
      }

      // Generate reasons
      const limits = recommendedPlan.limits as any;
      for (const [usageType, usage] of Object.entries(currentUsage)) {
        const limit = limits[usageType];

        if (limit !== null && usage > limit * 0.8) {
          reasons.push(
            `Your ${usageType} usage (${usage}) is approaching the limit (${limit})`
          );
        }
      }

      if (reasons.length === 0) {
        reasons.push('This plan matches your current usage patterns');
      }

      return {
        recommendedPlan,
        reasons,
      };
    } catch (error) {
      logger.error('Failed to get plan recommendation', { error, currentUsage });
      throw error;
    }
  }
}

export default new PlanService();
