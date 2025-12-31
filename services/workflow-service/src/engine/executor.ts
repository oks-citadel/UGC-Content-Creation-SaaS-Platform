import { prisma } from '../lib/prisma';
import { ExecutionStatus } from '.prisma/workflow-client';
import { actions } from './actions';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'workflow-executor' });

export class WorkflowExecutor {
  async execute(workflowId: string, trigger?: string, input?: any): Promise<string> {
    const execution = await prisma.workflowExecution.create({
      data: { workflowId, status: ExecutionStatus.RUNNING, trigger, input },
    });

    try {
      const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
      if (!workflow) throw new Error('Workflow not found');

      const definition = workflow.definition as any;
      const nodes = definition.nodes || [];
      const connections = definition.connections || {};

      let context: any = { input, trigger };
      const startTime = Date.now();
      const timeout = config.workflow.maxExecutionTime;

      for (const node of nodes) {
        if (Date.now() - startTime > timeout) {
          throw new Error('Workflow execution timeout');
        }

        const step = await prisma.executionStep.create({
          data: {
            executionId: execution.id,
            stepId: node.id,
            name: node.name,
            type: node.type,
            status: ExecutionStatus.RUNNING,
            input: context,
            startedAt: new Date(),
          },
        });

        try {
          const stepStartTime = Date.now();
          const action = actions[node.type];
          if (!action) throw new Error(`Unknown action type: ${node.type}`);

          const output = await action.execute(node.parameters, context);
          context = { ...context, [node.id]: output };

          await prisma.executionStep.update({
            where: { id: step.id },
            data: {
              status: ExecutionStatus.COMPLETED,
              output,
              duration: Date.now() - stepStartTime,
              completedAt: new Date(),
            },
          });

          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { stepsExecuted: { increment: 1 } },
          });
        } catch (error: any) {
          await prisma.executionStep.update({
            where: { id: step.id },
            data: {
              status: ExecutionStatus.FAILED,
              error: error.message,
              completedAt: new Date(),
            },
          });

          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { stepsFailed: { increment: 1 } },
          });

          if (!node.continueOnFail) throw error;
        }
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.COMPLETED,
          output: context,
          duration: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      return execution.id;
    } catch (error: any) {
      logger.error({ error, workflowId, executionId: execution.id }, 'Workflow execution failed');
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async pause(executionId: string): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.CANCELLED },
    });
  }
}

export const workflowExecutor = new WorkflowExecutor();
