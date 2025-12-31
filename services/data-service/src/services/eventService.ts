import { v4 as uuidv4 } from 'uuid';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { BaseEvent, ProcessedEvent, BatchEventRequest, BatchEventResult } from '../types/event';
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
