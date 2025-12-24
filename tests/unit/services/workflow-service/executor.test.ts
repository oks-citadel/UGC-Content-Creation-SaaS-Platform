import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing
vi.mock('../../../../services/workflow-service/src/lib/prisma', () => ({
  prisma: {
    workflowExecution: {
      create: vi.fn(),
      update: vi.fn(),
    },
    workflow: {
      findUnique: vi.fn(),
    },
    executionStep: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../../../services/workflow-service/src/engine/actions', () => ({
  actions: {
    'send_email': {
      execute: vi.fn().mockResolvedValue({ sent: true, messageId: 'msg-123' }),
    },
    'http_request': {
      execute: vi.fn().mockResolvedValue({ status: 200, data: { success: true } }),
    },
    'transform_data': {
      execute: vi.fn().mockResolvedValue({ transformed: true }),
    },
    'conditional': {
      execute: vi.fn().mockResolvedValue({ condition: true, branch: 'then' }),
    },
    'delay': {
      execute: vi.fn().mockResolvedValue({ delayed: true }),
    },
    'failing_action': {
      execute: vi.fn().mockRejectedValue(new Error('Action failed')),
    },
  },
}));

vi.mock('../../../../services/workflow-service/src/config', () => ({
  config: {
    workflow: {
      maxExecutionTime: 60000, // 1 minute for tests
    },
  },
}));

vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

import { WorkflowExecutor } from '../../../../services/workflow-service/src/engine/executor';
import { prisma } from '../../../../services/workflow-service/src/lib/prisma';
import { actions } from '../../../../services/workflow-service/src/engine/actions';

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Workflow Execution', () => {
    it('should execute a simple workflow successfully', async () => {
      const workflowId = 'workflow-123';
      const executionId = 'execution-456';

      const mockWorkflow = {
        id: workflowId,
        name: 'Simple Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Send Email', type: 'send_email', parameters: { to: 'test@example.com' } },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);

      vi.mocked(prisma.executionStep.create).mockResolvedValue({
        id: 'step-1',
        executionId,
        stepId: 'node-1',
        name: 'Send Email',
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      const result = await executor.execute(workflowId);

      expect(result).toBe(executionId);
      expect(prisma.workflowExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId,
          status: 'RUNNING',
        }),
      });
    });

    it('should execute workflow with multiple nodes', async () => {
      const workflowId = 'workflow-multi';
      const executionId = 'execution-multi';

      const mockWorkflow = {
        id: workflowId,
        name: 'Multi-Step Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Transform Data', type: 'transform_data', parameters: {} },
            { id: 'node-2', name: 'Send Email', type: 'send_email', parameters: { to: 'test@example.com' } },
            { id: 'node-3', name: 'HTTP Request', type: 'http_request', parameters: { url: 'https://api.example.com' } },
          ],
          connections: {
            'node-1': ['node-2'],
            'node-2': ['node-3'],
          },
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      const result = await executor.execute(workflowId);

      expect(result).toBe(executionId);
      expect(prisma.executionStep.create).toHaveBeenCalledTimes(3);
    });

    it('should pass trigger data to execution', async () => {
      const workflowId = 'workflow-trigger';
      const executionId = 'execution-trigger';
      const triggerData = { eventType: 'content_approved', contentId: 'content-123' };

      const mockWorkflow = {
        id: workflowId,
        name: 'Triggered Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Process Event', type: 'transform_data', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
        trigger: 'content_approved',
        input: triggerData,
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId, 'content_approved', triggerData);

      expect(prisma.workflowExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trigger: 'content_approved',
          input: triggerData,
        }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent workflow', async () => {
      const workflowId = 'non-existent-workflow';

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: 'execution-123',
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await expect(executor.execute(workflowId)).rejects.toThrow('Workflow not found');
    });

    it('should handle step execution failure', async () => {
      const workflowId = 'workflow-fail';
      const executionId = 'execution-fail';

      const mockWorkflow = {
        id: workflowId,
        name: 'Failing Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Failing Action', type: 'failing_action', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await expect(executor.execute(workflowId)).rejects.toThrow('Action failed');

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: expect.objectContaining({
          status: 'FAILED',
          error: 'Action failed',
        }),
      });
    });

    it('should continue on failure when continueOnFail is set', async () => {
      const workflowId = 'workflow-continue';
      const executionId = 'execution-continue';

      const mockWorkflow = {
        id: workflowId,
        name: 'Continue on Fail Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Failing Action', type: 'failing_action', parameters: {}, continueOnFail: true },
            { id: 'node-2', name: 'Send Email', type: 'send_email', parameters: { to: 'test@example.com' } },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      const result = await executor.execute(workflowId);

      expect(result).toBe(executionId);
      expect(prisma.executionStep.create).toHaveBeenCalledTimes(2);
    });

    it('should handle unknown action type', async () => {
      const workflowId = 'workflow-unknown';
      const executionId = 'execution-unknown';

      const mockWorkflow = {
        id: workflowId,
        name: 'Unknown Action Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Unknown Action', type: 'unknown_action_type', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await expect(executor.execute(workflowId)).rejects.toThrow('Unknown action type');
    });
  });

  describe('Step Tracking', () => {
    it('should increment stepsExecuted counter', async () => {
      const workflowId = 'workflow-counter';
      const executionId = 'execution-counter';

      const mockWorkflow = {
        id: workflowId,
        name: 'Counter Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Step 1', type: 'transform_data', parameters: {} },
            { id: 'node-2', name: 'Step 2', type: 'send_email', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: { stepsExecuted: { increment: 1 } },
      });
    });

    it('should increment stepsFailed counter on failure', async () => {
      const workflowId = 'workflow-fail-counter';
      const executionId = 'execution-fail-counter';

      const mockWorkflow = {
        id: workflowId,
        name: 'Fail Counter Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Failing Step', type: 'failing_action', parameters: {}, continueOnFail: true },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: { stepsFailed: { increment: 1 } },
      });
    });

    it('should track step duration', async () => {
      const workflowId = 'workflow-duration';
      const executionId = 'execution-duration';

      const mockWorkflow = {
        id: workflowId,
        name: 'Duration Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Timed Step', type: 'transform_data', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.executionStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          duration: expect.any(Number),
          completedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('Context Passing', () => {
    it('should pass context between nodes', async () => {
      const workflowId = 'workflow-context';
      const executionId = 'execution-context';

      const mockWorkflow = {
        id: workflowId,
        name: 'Context Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Transform', type: 'transform_data', parameters: {} },
            { id: 'node-2', name: 'Email', type: 'send_email', parameters: {} },
          ],
          connections: { 'node-1': ['node-2'] },
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      // Verify the second action was called with context from first
      expect(actions['send_email'].execute).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          'node-1': { transformed: true },
        })
      );
    });

    it('should include input and trigger in context', async () => {
      const workflowId = 'workflow-input-context';
      const executionId = 'execution-input-context';
      const input = { userId: 'user-123', action: 'create' };

      const mockWorkflow = {
        id: workflowId,
        name: 'Input Context Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Process', type: 'transform_data', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId, 'manual', input);

      expect(actions['transform_data'].execute).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          input,
          trigger: 'manual',
        })
      );
    });
  });

  describe('Execution Completion', () => {
    it('should mark execution as completed on success', async () => {
      const workflowId = 'workflow-complete';
      const executionId = 'execution-complete';

      const mockWorkflow = {
        id: workflowId,
        name: 'Complete Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Final Step', type: 'transform_data', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      });
    });

    it('should include output context in completed execution', async () => {
      const workflowId = 'workflow-output';
      const executionId = 'execution-output';

      const mockWorkflow = {
        id: workflowId,
        name: 'Output Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Transform', type: 'transform_data', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: expect.objectContaining({
          output: expect.objectContaining({
            'node-1': { transformed: true },
          }),
        }),
      });
    });

    it('should calculate total execution duration', async () => {
      const workflowId = 'workflow-total-duration';
      const executionId = 'execution-total-duration';

      const mockWorkflow = {
        id: workflowId,
        name: 'Duration Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Step 1', type: 'transform_data', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: expect.objectContaining({
          duration: expect.any(Number),
        }),
      });
    });
  });

  describe('Pause Functionality', () => {
    it('should pause a running execution', async () => {
      const executionId = 'execution-pause';

      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({
        id: executionId,
        status: 'CANCELLED',
      } as any);

      await executor.pause(executionId);

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: executionId },
        data: { status: 'CANCELLED' },
      });
    });
  });

  describe('Empty Workflow', () => {
    it('should handle workflow with no nodes', async () => {
      const workflowId = 'workflow-empty';
      const executionId = 'execution-empty';

      const mockWorkflow = {
        id: workflowId,
        name: 'Empty Workflow',
        definition: {
          nodes: [],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      const result = await executor.execute(workflowId);

      expect(result).toBe(executionId);
      expect(prisma.executionStep.create).not.toHaveBeenCalled();
    });
  });

  describe('Complex Workflows', () => {
    it('should handle conditional branching', async () => {
      const workflowId = 'workflow-conditional';
      const executionId = 'execution-conditional';

      const mockWorkflow = {
        id: workflowId,
        name: 'Conditional Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Check Condition', type: 'conditional', parameters: { condition: 'input.value > 10' } },
            { id: 'node-2', name: 'Then Branch', type: 'send_email', parameters: {} },
            { id: 'node-3', name: 'Else Branch', type: 'transform_data', parameters: {} },
          ],
          connections: {
            'node-1': ['node-2', 'node-3'],
          },
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      const result = await executor.execute(workflowId);

      expect(result).toBe(executionId);
    });

    it('should handle parallel execution paths', async () => {
      const workflowId = 'workflow-parallel';
      const executionId = 'execution-parallel';

      const mockWorkflow = {
        id: workflowId,
        name: 'Parallel Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Start', type: 'transform_data', parameters: {} },
            { id: 'node-2', name: 'Path A', type: 'send_email', parameters: {} },
            { id: 'node-3', name: 'Path B', type: 'http_request', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      const result = await executor.execute(workflowId);

      expect(result).toBe(executionId);
      expect(prisma.executionStep.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('Step Status Updates', () => {
    it('should mark step as RUNNING before execution', async () => {
      const workflowId = 'workflow-step-running';
      const executionId = 'execution-step-running';

      const mockWorkflow = {
        id: workflowId,
        name: 'Step Running Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Running Step', type: 'transform_data', parameters: {} },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.executionStep.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'RUNNING',
          startedAt: expect.any(Date),
        }),
      });
    });

    it('should mark step as FAILED on error', async () => {
      const workflowId = 'workflow-step-fail';
      const executionId = 'execution-step-fail';

      const mockWorkflow = {
        id: workflowId,
        name: 'Step Fail Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Failing Step', type: 'failing_action', parameters: {}, continueOnFail: true },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.executionStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: expect.objectContaining({
          status: 'FAILED',
          error: 'Action failed',
        }),
      });
    });

    it('should include step output on completion', async () => {
      const workflowId = 'workflow-step-output';
      const executionId = 'execution-step-output';

      const mockWorkflow = {
        id: workflowId,
        name: 'Step Output Workflow',
        definition: {
          nodes: [
            { id: 'node-1', name: 'Output Step', type: 'send_email', parameters: { to: 'test@example.com' } },
          ],
          connections: {},
        },
      };

      vi.mocked(prisma.workflowExecution.create).mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'RUNNING',
      } as any);

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);
      vi.mocked(prisma.executionStep.create).mockResolvedValue({ id: 'step-1' } as any);
      vi.mocked(prisma.executionStep.update).mockResolvedValue({} as any);
      vi.mocked(prisma.workflowExecution.update).mockResolvedValue({} as any);

      await executor.execute(workflowId);

      expect(prisma.executionStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: expect.objectContaining({
          output: { sent: true, messageId: 'msg-123' },
        }),
      });
    });
  });
});
