import { Router, Request, Response } from 'express';
import planService from '../services/plan.service';
import { PlanName } from '@prisma/client';
import logger from '../utils/logger';

const router: Router = Router();

// Get all plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;

    const plans = await planService.getAllPlans(
      includeInactive === 'true'
    );

    res.json({ plans });
  } catch (error) {
    logger.error('Failed to get plans', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve plans',
    });
  }
});

// Get plan by name
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const plan = await planService.getPlanByName(name as PlanName);

    if (!plan) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Plan not found',
      });
    }

    res.json({ plan });
  } catch (error) {
    logger.error('Failed to get plan', { error, name: req.params.name });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve plan',
    });
  }
});

// Compare plans
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { currentPlan, targetPlan } = req.body;

    if (!currentPlan || !targetPlan) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current plan and target plan are required',
      });
    }

    const comparison = await planService.comparePlans(
      currentPlan as PlanName,
      targetPlan as PlanName
    );

    res.json({ comparison });
  } catch (error: any) {
    logger.error('Failed to compare plans', { error, body: req.body });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to compare plans',
    });
  }
});

// Get plan recommendation
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { currentUsage } = req.body;

    if (!currentUsage) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current usage is required',
      });
    }

    const recommendation = await planService.getPlanRecommendation(
      currentUsage
    );

    res.json({ recommendation });
  } catch (error) {
    logger.error('Failed to get plan recommendation', { error, body: req.body });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get plan recommendation',
    });
  }
});

export default router;
