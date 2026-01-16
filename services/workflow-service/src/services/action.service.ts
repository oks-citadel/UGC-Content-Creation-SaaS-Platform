import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface CreateActionInput {
  workflowId?: string;
  userId: string;
  name: string;
  description?: string;
  type: string;
  config: Record<string, any>;
  order?: number;
  retryConfig?: Record<string, any>;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface UpdateActionInput {
  name?: string;
  description?: string;
  type?: string;
  config?: Record<string, any>;
  order?: number;
  retryConfig?: Record<string, any>;
  timeout?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface ActionQuery {
  workflowId?: string;
  userId?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

const ACTION_TYPES = [
  { id: 'SEND_EMAIL', name: 'Send Email', description: 'Send an email to recipient', category: 'communication' },
  { id: 'SEND_SMS', name: 'Send SMS', description: 'Send an SMS message', category: 'communication' },
  { id: 'SEND_NOTIFICATION', name: 'Send Notification', description: 'Send in-app notification', category: 'communication' },
  { id: 'SEND_PUSH', name: 'Send Push', description: 'Send push notification', category: 'communication' },
  { id: 'UPDATE_SEGMENT', name: 'Update Segment', description: 'Add/remove from segment', category: 'data' },
  { id: 'UPDATE_PROFILE', name: 'Update Profile', description: 'Update user profile data', category: 'data' },
  { id: 'CALL_WEBHOOK', name: 'Call Webhook', description: 'Make HTTP request to webhook', category: 'integration' },
  { id: 'CALL_API', name: 'Call API', description: 'Make API request', category: 'integration' },
  { id: 'DELAY', name: 'Delay', description: 'Wait for specified duration', category: 'flow' },
  { id: 'CONDITION', name: 'Condition', description: 'Branch based on conditions', category: 'flow' },
  { id: 'SPLIT', name: 'Split', description: 'A/B split traffic', category: 'flow' },
  { id: 'MERGE', name: 'Merge', description: 'Merge branches', category: 'flow' },
  { id: 'TRANSFORM', name: 'Transform', description: 'Transform data', category: 'data' },
  { id: 'LOG', name: 'Log', description: 'Log data for debugging', category: 'utility' },
];

class ActionService {
  getTypes() {
    return ACTION_TYPES;
  }

  async create(input: CreateActionInput) {
    const action = await prisma.flowAction.create({
      data: {
        id: uuidv4(),
        workflowId: input.workflowId,
        userId: input.userId,
        name: input.name,
        description: input.description,
        type: input.type as any,
        config: input.config as any,
        order: input.order || 0,
        retryConfig: input.retryConfig as any,
        timeout: input.timeout,
        metadata: input.metadata as any,
      },
    });

    return action;
  }

  async findAll(query: ActionQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.workflowId) where.workflowId = query.workflowId;
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [actions, total] = await Promise.all([
      prisma.flowAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: { workflow: { select: { id: true, name: true } } },
      }),
      prisma.flowAction.count({ where }),
    ]);

    return {
      actions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return prisma.flowAction.findUnique({
      where: { id },
      include: { workflow: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, input: UpdateActionInput) {
    return prisma.flowAction.update({
      where: { id },
      data: {
        ...input,
        type: input.type as any,
        config: input.config as any,
        retryConfig: input.retryConfig as any,
        metadata: input.metadata as any,
      },
    });
  }

  async delete(id: string) {
    await prisma.flowAction.delete({ where: { id } });
  }

  async reorder(workflowId: string, actionIds: string[]) {
    const updates = actionIds.map((id, index) =>
      prisma.flowAction.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);
  }
}

export const actionService = new ActionService();
