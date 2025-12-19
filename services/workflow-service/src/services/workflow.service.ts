import { prisma } from '../lib/prisma';
import { workflowExecutor } from '../engine/executor';
import { TriggerType } from '@prisma/client';
import cronParser from 'cron-parser';
import pino from 'pino';

const logger = pino({ name: 'workflow-service' });

export class WorkflowService {
  async create(userId: string, name: string, description: string | undefined, definition: any, trigger: TriggerType, triggerConfig?: any) {
    const workflow = await prisma.workflow.create({
      data: { userId, name, description, definition, trigger, triggerConfig, isActive: false },
    });

    if (trigger === TriggerType.SCHEDULE && triggerConfig?.cronExpression) {
      const interval = cronParser.parseExpression(triggerConfig.cronExpression);
      const nextRunAt = interval.next().toDate();

      await prisma.workflowSchedule.create({
        data: {
          workflowId: workflow.id,
          cronExpression: triggerConfig.cronExpression,
          timezone: triggerConfig.timezone || 'UTC',
          nextRunAt,
        },
      });
    }

    return workflow;
  }

  async update(workflowId: string, data: any) {
    return prisma.workflow.update({ where: { id: workflowId }, data });
  }

  async delete(workflowId: string) {
    return prisma.workflow.delete({ where: { id: workflowId } });
  }

  async execute(workflowId: string, input?: any) {
    return workflowExecutor.execute(workflowId, 'manual', input);
  }

  async pause(executionId: string) {
    return workflowExecutor.pause(executionId);
  }

  async activate(workflowId: string) {
    return prisma.workflow.update({ where: { id: workflowId }, data: { isActive: true } });
  }

  async deactivate(workflowId: string) {
    return prisma.workflow.update({ where: { id: workflowId }, data: { isActive: false } });
  }
}

export const workflowService = new WorkflowService();
