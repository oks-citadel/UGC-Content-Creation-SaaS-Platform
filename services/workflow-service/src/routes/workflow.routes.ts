import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { workflowService } from '../services/workflow.service';
import { simulationService } from '../services/simulation.service';
import { TriggerType } from '.prisma/workflow-client';

const router: Router = Router();

const createWorkflowSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  definition: z.record(z.any()),
  trigger: z.nativeEnum(TriggerType),
  triggerConfig: z.record(z.any()).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const input = createWorkflowSchema.parse(req.body);
    const workflow = await workflowService.create(input.userId, input.name, input.description, input.definition, input.trigger, input.triggerConfig);
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId', async (req, res, next) => {
  try {
    const workflows = await prisma.workflow.findMany({ where: { userId: req.params.userId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: workflows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id: req.params.id }, include: { schedules: true } });
    if (!workflow) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const workflow = await workflowService.update(req.params.id, req.body);
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await workflowService.delete(req.params.id);
    res.json({ success: true, data: { message: 'Workflow deleted' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/execute', async (req, res, next) => {
  try {
    const executionId = await workflowService.execute(req.params.id, req.body.input);
    res.json({ success: true, data: { executionId } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/activate', async (req, res, next) => {
  try {
    const workflow = await workflowService.activate(req.params.id);
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const workflow = await workflowService.deactivate(req.params.id);
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/executions', async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where: { workflowId: req.params.id },
        orderBy: { startedAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: { steps: true },
      }),
      prisma.workflowExecution.count({ where: { workflowId: req.params.id } }),
    ]);
    res.json({ success: true, data: executions, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (error) {
    next(error);
  }
});

router.get('/executions/:executionId', async (req, res, next) => {
  try {
    const execution = await prisma.workflowExecution.findUnique({ where: { id: req.params.executionId }, include: { steps: true, workflow: true } });
    if (!execution) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Execution not found' } });
    res.json({ success: true, data: execution });
  } catch (error) {
    next(error);
  }
});

router.post('/executions/:executionId/cancel', async (req, res, next) => {
  try {
    await workflowService.pause(req.params.executionId);
    res.json({ success: true, data: { message: 'Execution cancelled' } });
  } catch (error) {
    next(error);
  }
});

// Simulation Routes

// POST /:id/simulate - Simulate flow execution
router.post('/:id/simulate', async (req, res, next) => {
  try {
    const { testData, simulationType, createdBy } = req.body;
    const result = await simulationService.simulate({
      workflowId: req.params.id,
      testData,
      simulationType,
      createdBy,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /:id/dry-run - Dry run with test data
router.post('/:id/dry-run', async (req, res, next) => {
  try {
    const { testData, createdBy } = req.body;
    const result = await simulationService.dryRun(req.params.id, testData || {}, createdBy);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /:id/simulation-results - Get simulation results
router.get('/:id/simulation-results', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await simulationService.getResults(req.params.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /simulations/:simulationId - Get single simulation result
router.get('/simulations/:simulationId', async (req, res, next) => {
  try {
    const result = await simulationService.getResultById(req.params.simulationId);
    if (!result) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Simulation not found' } });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
