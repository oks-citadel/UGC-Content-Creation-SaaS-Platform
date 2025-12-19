import { prisma } from '../lib/prisma';
import { workflowExecutor } from './executor';
import cronParser from 'cron-parser';
import pino from 'pino';

const logger = pino({ name: 'workflow-scheduler' });

export class WorkflowScheduler {
  async processSchedules(): Promise<void> {
    try {
      const now = new Date();
      const schedules = await prisma.workflowSchedule.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now },
        },
        include: { workflow: true },
      });

      for (const schedule of schedules) {
        if (!schedule.workflow.isActive) continue;

        try {
          await workflowExecutor.execute(schedule.workflowId, 'schedule');

          const interval = cronParser.parseExpression(schedule.cronExpression, {
            currentDate: now,
            tz: schedule.timezone,
          });
          const nextRunAt = interval.next().toDate();

          await prisma.workflowSchedule.update({
            where: { id: schedule.id },
            data: { lastRunAt: now, nextRunAt },
          });

          logger.info({ scheduleId: schedule.id, workflowId: schedule.workflowId }, 'Workflow executed on schedule');
        } catch (error: any) {
          logger.error({ error, scheduleId: schedule.id }, 'Failed to execute scheduled workflow');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to process schedules');
    }
  }
}
