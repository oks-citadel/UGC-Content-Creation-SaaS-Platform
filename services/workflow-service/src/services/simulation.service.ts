import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface SimulateInput {
  workflowId: string;
  testData?: Record<string, any>;
  simulationType?: 'DRY_RUN' | 'FULL_SIMULATION' | 'STEP_BY_STEP';
  createdBy?: string;
}

export interface SimulationStep {
  stepId: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
}

class SimulationService {
  async simulate(input: SimulateInput) {
    const startTime = Date.now();

    // Get workflow with triggers and actions
    const workflow = await prisma.workflow.findUnique({
      where: { id: input.workflowId },
      include: {
        flowTriggers: { where: { isActive: true } },
        flowActions: { where: { isActive: true }, orderBy: { order: 'asc' } },
      },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Create simulation result record
    const simulation = await prisma.simulationResult.create({
      data: {
        id: uuidv4(),
        workflowId: input.workflowId,
        simulationType: input.simulationType || 'DRY_RUN',
        status: 'RUNNING',
        testData: input.testData as any,
        input: input.testData as any,
        createdBy: input.createdBy,
      },
    });

    const steps: SimulationStep[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let currentData = input.testData || {};

    try {
      // Simulate trigger evaluation
      for (const trigger of workflow.flowTriggers) {
        const step: SimulationStep = {
          stepId: trigger.id,
          name: trigger.name,
          type: `trigger:${trigger.type}`,
          status: 'running',
          input: currentData,
        };

        try {
          const result = this.evaluateTrigger(trigger, currentData);
          step.status = result.triggered ? 'completed' : 'skipped';
          step.output = result;
          if (!result.triggered) {
            warnings.push(`Trigger "${trigger.name}" would not fire with test data`);
          }
        } catch (error: any) {
          step.status = 'failed';
          step.error = error.message;
          errors.push(`Trigger "${trigger.name}": ${error.message}`);
        }

        steps.push(step);
      }

      // Simulate action execution
      for (const action of workflow.flowActions) {
        const step: SimulationStep = {
          stepId: action.id,
          name: action.name,
          type: `action:${action.type}`,
          status: 'running',
          input: currentData,
        };

        try {
          const result = await this.simulateAction(action, currentData, input.simulationType === 'DRY_RUN');
          step.status = 'completed';
          step.output = result.output;
          step.duration = result.duration;
          currentData = { ...currentData, ...result.output };

          if (result.warnings) {
            warnings.push(...result.warnings);
          }
        } catch (error: any) {
          step.status = 'failed';
          step.error = error.message;
          errors.push(`Action "${action.name}": ${error.message}`);

          // In dry run, continue to next step; in full simulation, stop
          if (input.simulationType !== 'DRY_RUN') {
            break;
          }
        }

        steps.push(step);
      }

      const duration = Date.now() - startTime;
      const finalStatus = errors.length > 0 ? 'FAILED' : 'COMPLETED';

      // Update simulation result
      await prisma.simulationResult.update({
        where: { id: simulation.id },
        data: {
          status: finalStatus,
          output: currentData as any,
          steps: steps as any,
          errors: errors.length > 0 ? errors : null,
          warnings: warnings.length > 0 ? warnings : null,
          metrics: {
            totalSteps: steps.length,
            completedSteps: steps.filter(s => s.status === 'completed').length,
            failedSteps: steps.filter(s => s.status === 'failed').length,
            skippedSteps: steps.filter(s => s.status === 'skipped').length,
          },
          duration,
          completedAt: new Date(),
        },
      });

      return {
        id: simulation.id,
        status: finalStatus,
        steps,
        errors,
        warnings,
        output: currentData,
        duration,
      };
    } catch (error: any) {
      await prisma.simulationResult.update({
        where: { id: simulation.id },
        data: {
          status: 'FAILED',
          errors: [error.message],
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async dryRun(workflowId: string, testData: Record<string, any>, createdBy?: string) {
    return this.simulate({
      workflowId,
      testData,
      simulationType: 'DRY_RUN',
      createdBy,
    });
  }

  async getResults(workflowId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      prisma.simulationResult.findMany({
        where: { workflowId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.simulationResult.count({ where: { workflowId } }),
    ]);

    return {
      results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getResultById(id: string) {
    return prisma.simulationResult.findUnique({ where: { id } });
  }

  private evaluateTrigger(trigger: any, data: Record<string, any>) {
    const config = trigger.config as Record<string, any>;
    const conditions = trigger.conditions as Record<string, any> | null;

    // Simple trigger evaluation logic
    switch (trigger.type) {
      case 'EVENT':
        const eventType = config.eventType;
        return {
          triggered: data.eventType === eventType || !eventType,
          reason: data.eventType === eventType ? 'Event type matched' : 'Event type did not match',
        };

      case 'CONDITION':
        if (!conditions) return { triggered: true, reason: 'No conditions specified' };
        const conditionsMet = this.evaluateConditions(conditions, data);
        return {
          triggered: conditionsMet,
          reason: conditionsMet ? 'All conditions met' : 'Conditions not met',
        };

      case 'WEBHOOK':
      case 'API_CALL':
        return { triggered: true, reason: 'Manual trigger type' };

      case 'SCHEDULE':
        return { triggered: true, reason: 'Schedule trigger (always simulates as triggered)' };

      case 'SEGMENT_ENTRY':
      case 'SEGMENT_EXIT':
        return {
          triggered: data.segmentId === config.segmentId,
          reason: data.segmentId === config.segmentId ? 'Segment matched' : 'Segment did not match',
        };

      default:
        return { triggered: true, reason: 'Unknown trigger type' };
    }
  }

  private evaluateConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    // Simple condition evaluation
    for (const [field, expected] of Object.entries(conditions)) {
      if (data[field] !== expected) {
        return false;
      }
    }
    return true;
  }

  private async simulateAction(
    action: any,
    data: Record<string, any>,
    isDryRun: boolean
  ): Promise<{ output: any; duration: number; warnings?: string[] }> {
    const startTime = Date.now();
    const config = action.config as Record<string, any>;
    const warnings: string[] = [];

    switch (action.type) {
      case 'SEND_EMAIL':
        if (isDryRun) {
          warnings.push(`Would send email to: ${config.to || data.email || 'unknown'}`);
        }
        return {
          output: { emailSent: !isDryRun, recipient: config.to || data.email },
          duration: Date.now() - startTime,
          warnings,
        };

      case 'SEND_SMS':
        if (isDryRun) {
          warnings.push(`Would send SMS to: ${config.to || data.phone || 'unknown'}`);
        }
        return {
          output: { smsSent: !isDryRun, recipient: config.to || data.phone },
          duration: Date.now() - startTime,
          warnings,
        };

      case 'DELAY':
        const delayMs = config.duration || 0;
        if (!isDryRun) {
          await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 1000))); // Cap at 1s for simulation
        }
        return {
          output: { delayed: true, duration: delayMs },
          duration: Date.now() - startTime,
          warnings: isDryRun ? [`Would delay for ${delayMs}ms`] : undefined,
        };

      case 'UPDATE_SEGMENT':
        return {
          output: { segmentUpdated: !isDryRun, segmentId: config.segmentId, action: config.action },
          duration: Date.now() - startTime,
          warnings: isDryRun ? [`Would ${config.action} user to/from segment ${config.segmentId}`] : undefined,
        };

      case 'UPDATE_PROFILE':
        return {
          output: { profileUpdated: !isDryRun, fields: Object.keys(config.fields || {}) },
          duration: Date.now() - startTime,
          warnings: isDryRun ? [`Would update profile fields: ${Object.keys(config.fields || {}).join(', ')}`] : undefined,
        };

      case 'CALL_WEBHOOK':
        if (isDryRun) {
          warnings.push(`Would call webhook: ${config.url}`);
        }
        return {
          output: { webhookCalled: !isDryRun, url: config.url },
          duration: Date.now() - startTime,
          warnings,
        };

      case 'CONDITION':
        const conditionResult = this.evaluateConditions(config.conditions || {}, data);
        return {
          output: { conditionResult, branch: conditionResult ? 'true' : 'false' },
          duration: Date.now() - startTime,
        };

      case 'TRANSFORM':
        return {
          output: { transformed: true, ...config.transform },
          duration: Date.now() - startTime,
        };

      case 'LOG':
        return {
          output: { logged: true, message: config.message, data },
          duration: Date.now() - startTime,
        };

      default:
        return {
          output: { executed: !isDryRun },
          duration: Date.now() - startTime,
          warnings: isDryRun ? [`Would execute action type: ${action.type}`] : undefined,
        };
    }
  }
}

export const simulationService = new SimulationService();
