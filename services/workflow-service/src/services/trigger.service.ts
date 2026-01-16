import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTriggerInput {
  workflowId?: string;
  userId: string;
  name: string;
  description?: string;
  type: 'EVENT' | 'SCHEDULE' | 'WEBHOOK' | 'CONDITION' | 'SEGMENT_ENTRY' | 'SEGMENT_EXIT' | 'API_CALL';
  config: Record<string, any>;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateTriggerInput {
  name?: string;
  description?: string;
  type?: 'EVENT' | 'SCHEDULE' | 'WEBHOOK' | 'CONDITION' | 'SEGMENT_ENTRY' | 'SEGMENT_EXIT' | 'API_CALL';
  config?: Record<string, any>;
  conditions?: Record<string, any>;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface TriggerQuery {
  workflowId?: string;
  userId?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

const TRIGGER_TYPES = [
  { id: 'EVENT', name: 'Event', description: 'Trigger when a specific event occurs' },
  { id: 'SCHEDULE', name: 'Schedule', description: 'Trigger on a cron schedule' },
  { id: 'WEBHOOK', name: 'Webhook', description: 'Trigger via incoming webhook' },
  { id: 'CONDITION', name: 'Condition', description: 'Trigger when conditions are met' },
  { id: 'SEGMENT_ENTRY', name: 'Segment Entry', description: 'Trigger when user enters a segment' },
  { id: 'SEGMENT_EXIT', name: 'Segment Exit', description: 'Trigger when user exits a segment' },
  { id: 'API_CALL', name: 'API Call', description: 'Trigger via explicit API call' },
];

class TriggerService {
  getTypes() {
    return TRIGGER_TYPES;
  }

  async create(input: CreateTriggerInput) {
    const trigger = await prisma.flowTrigger.create({
      data: {
        id: uuidv4(),
        workflowId: input.workflowId,
        userId: input.userId,
        name: input.name,
        description: input.description,
        type: input.type,
        config: input.config as any,
        conditions: input.conditions as any,
        metadata: input.metadata as any,
      },
    });

    return trigger;
  }

  async findAll(query: TriggerQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.workflowId) where.workflowId = query.workflowId;
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [triggers, total] = await Promise.all([
      prisma.flowTrigger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { workflow: { select: { id: true, name: true } } },
      }),
      prisma.flowTrigger.count({ where }),
    ]);

    return {
      triggers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return prisma.flowTrigger.findUnique({
      where: { id },
      include: { workflow: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, input: UpdateTriggerInput) {
    return prisma.flowTrigger.update({
      where: { id },
      data: {
        ...input,
        config: input.config as any,
        conditions: input.conditions as any,
        metadata: input.metadata as any,
      },
    });
  }

  async delete(id: string) {
    await prisma.flowTrigger.delete({ where: { id } });
  }
}

export const triggerService = new TriggerService();
