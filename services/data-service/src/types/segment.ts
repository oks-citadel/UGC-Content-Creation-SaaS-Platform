import { z } from 'zod';

export enum SegmentType {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
  COMPUTED = 'COMPUTED',
  HYBRID = 'HYBRID',
}

export enum SegmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  ARCHIVED = 'ARCHIVED',
}

export const segmentRuleSchema = z.object({
  field: z.string().min(1),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'in',
    'not_in',
    'between',
    'regex',
  ]),
  value: z.any(),
  groupId: z.string().optional(),
  groupLogic: z.enum(['AND', 'OR']).default('AND'),
  priority: z.number().default(0),
});

export const createSegmentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.nativeEnum(SegmentType).default(SegmentType.STATIC),
  rules: z.array(segmentRuleSchema).optional(),
  metadata: z.record(z.any()).optional(),
  createdBy: z.string().uuid(),
});

export const updateSegmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  type: z.nativeEnum(SegmentType).optional(),
  rules: z.array(segmentRuleSchema).optional(),
  status: z.nativeEnum(SegmentStatus).optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

export const addMembersSchema = z.object({
  members: z
    .array(
      z.object({
        entityType: z.string().min(1),
        entityId: z.string().uuid(),
        attributes: z.record(z.any()).optional(),
        expiresAt: z.string().datetime().optional(),
      })
    )
    .min(1)
    .max(1000),
});

export const segmentQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  type: z.nativeEnum(SegmentType).optional(),
  status: z.nativeEnum(SegmentStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'memberCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const memberQuerySchema = z.object({
  entityType: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
export type SegmentQuery = z.infer<typeof segmentQuerySchema>;
export type MemberQuery = z.infer<typeof memberQuerySchema>;
export type SegmentRule = z.infer<typeof segmentRuleSchema>;
