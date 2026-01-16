import { z } from 'zod';

export enum EventType {
  USER_SIGNUP = 'user.signup',
  USER_LOGIN = 'user.login',
  CONTENT_CREATED = 'content.created',
  CONTENT_VIEWED = 'content.viewed',
  CONTENT_ENGAGEMENT = 'content.engagement',
  CAMPAIGN_CREATED = 'campaign.created',
  CAMPAIGN_STARTED = 'campaign.started',
  CAMPAIGN_COMPLETED = 'campaign.completed',
  CONVERSION_TRACKED = 'commerce.conversion_tracked',
  CUSTOM = 'custom',
}

export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EventSource {
  WEB_APP = 'web_app',
  MOBILE_APP = 'mobile_app',
  API = 'api',
  WEBHOOK = 'webhook',
  INTERNAL = 'internal',
}

export const eventMetadataSchema = z.object({
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string().optional(),
}).passthrough();

export const baseEventSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.nativeEnum(EventType).or(z.string()),
  source: z.nativeEnum(EventSource).or(z.string()),
  timestamp: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  priority: z.nativeEnum(EventPriority).default(EventPriority.NORMAL),
  payload: z.record(z.any()),
  metadata: eventMetadataSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export const batchEventSchema = z.object({
  events: z.array(baseEventSchema).min(1).max(1000),
  options: z.object({
    validateAll: z.boolean().default(true),
    continueOnError: z.boolean().default(false),
  }).optional(),
});

export type BaseEvent = z.infer<typeof baseEventSchema>;
export type BatchEventRequest = z.infer<typeof batchEventSchema>;

export interface ProcessedEvent extends BaseEvent {
  id: string;
  timestamp: string;
  processedAt: string;
  streamKey: string;
}

export interface BatchEventResult {
  total: number;
  successful: number;
  failed: number;
  events: Array<{ id: string; status: 'success' | 'failed'; error?: string }>;
}

export const eventQuerySchema = z.object({
  type: z.string().optional(),
  source: z.string().optional(),
  userId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  priority: z.nativeEnum(EventPriority).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['timestamp', 'createdAt', 'type', 'source']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type EventQuery = z.infer<typeof eventQuerySchema>;

export interface EventQueryResult {
  events: ProcessedEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
