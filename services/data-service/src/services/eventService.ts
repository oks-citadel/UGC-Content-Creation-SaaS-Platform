import { v4 as uuidv4 } from 'uuid';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { BaseEvent, ProcessedEvent, BatchEventRequest, BatchEventResult, EventQuery, EventQueryResult } from '../types/event';
import { config } from '../config';
import { logger } from '../lib/logger';

export class EventService {
  private readonly streamName = 'events:stream';
  private readonly maxStreamLength = 100000;

  async ingestEvent(event: BaseEvent): Promise<ProcessedEvent> {
    const processedEvent: ProcessedEvent = {
      ...event,
      id: event.id || uuidv4(),
      timestamp: event.timestamp || new Date().toISOString(),
      processedAt: new Date().toISOString(),
      streamKey: `${event.type}:${event.source}`,
    };

    await this.publishToStream(processedEvent);
    await this.persistEvent(processedEvent);

    logger.info({ eventId: processedEvent.id, type: processedEvent.type }, 'Event ingested');
    return processedEvent;
  }

  async ingestBatch(request: BatchEventRequest): Promise<BatchEventResult> {
    const results: BatchEventResult = {
      total: request.events.length,
      successful: 0,
      failed: 0,
      events: [],
    };

    for (const event of request.events) {
      try {
        const processed = await this.ingestEvent(event);
        results.successful++;
        results.events.push({ id: processed.id, status: 'success' });
      } catch (error) {
        results.failed++;
        results.events.push({
          id: event.id || 'unknown',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        if (!request.options?.continueOnError) break;
      }
    }

    return results;
  }

  private async publishToStream(event: ProcessedEvent): Promise<void> {
    await redis.xadd(
      this.streamName,
      'MAXLEN', '~', this.maxStreamLength.toString(),
      '*',
      'data', JSON.stringify(event)
    );
  }

  private async persistEvent(event: ProcessedEvent): Promise<void> {
    await prisma.event.create({
      data: {
        id: event.id,
        type: event.type,
        source: event.source,
        timestamp: new Date(event.timestamp),
        userId: event.userId,
        brandId: event.brandId,
        entityType: event.entityType,
        entityId: event.entityId,
        priority: event.priority,
        payload: event.payload as any,
        metadata: event.metadata as any,
        tags: event.tags || [],
        processedAt: new Date(event.processedAt),
      },
    });
  }

  async queryEvents(query: EventQuery): Promise<EventQueryResult> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.source) where.source = filters.source;
    if (filters.userId) where.userId = filters.userId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.priority) where.priority = filters.priority;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    if (filters.tags) {
      const tagsArray = filters.tags.split(',').map(t => t.trim());
      where.tags = { hasSome: tagsArray };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.event.count({ where }),
    ]);

    const processedEvents: ProcessedEvent[] = events.map(event => ({
      id: event.id,
      type: event.type,
      source: event.source,
      timestamp: event.timestamp.toISOString(),
      userId: event.userId || undefined,
      brandId: event.brandId || undefined,
      entityType: event.entityType || undefined,
      entityId: event.entityId || undefined,
      priority: event.priority as any,
      payload: event.payload as Record<string, any>,
      metadata: event.metadata as Record<string, any> | undefined,
      tags: event.tags,
      processedAt: event.processedAt?.toISOString() || event.createdAt.toISOString(),
      streamKey: `${event.type}:${event.source}`,
    }));

    return {
      events: processedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventStats(brandId?: string): Promise<Record<string, number>> {
    const where = brandId ? { brandId } : {};
    const stats = await prisma.event.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
    });
    return Object.fromEntries(stats.map(s => [s.type, s._count.id]));
  }
}

export const eventService = new EventService();
