import WebSocket from 'ws';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import config from '../config';
import metricsService from './metrics.service';

export interface Subscription {
  id: string;
  ws: WebSocket;
  entityType: string;
  entityId?: string;
  metrics?: string[];
}

class RealtimeService extends EventEmitter {
  private wss: WebSocket.Server | null = null;
  private subscriptions: Map<string, Subscription[]> = new Map();
  private redis: Redis;
  private publishRedis: Redis;

  constructor() {
    super();
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });

    this.publishRedis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });

    this.setupRedisSubscriptions();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(port: number = config.wsPort) {
    this.wss = new WebSocket.Server({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.removeSubscription(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send connection acknowledgment
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date() }));
    });

    console.log(`WebSocket server running on port ${port}`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: WebSocket, data: any) {
    const { type, payload } = data;

    switch (type) {
      case 'subscribe':
        this.subscribeToMetrics(ws, payload);
        break;
      case 'unsubscribe':
        this.unsubscribeFromMetrics(ws, payload);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  /**
   * Subscribe to real-time metrics
   */
  subscribeToMetrics(
    ws: WebSocket,
    options: {
      entityType: string;
      entityId?: string;
      metrics?: string[];
    }
  ) {
    const subscriptionKey = this.getSubscriptionKey(options.entityType, options.entityId);
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      ws,
      entityType: options.entityType,
      entityId: options.entityId,
      metrics: options.metrics,
    };

    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, []);
    }

    this.subscriptions.get(subscriptionKey)?.push(subscription);

    // Send confirmation
    ws.send(
      JSON.stringify({
        type: 'subscribed',
        subscriptionId: subscription.id,
        entityType: options.entityType,
        entityId: options.entityId,
      })
    );

    // Send initial data
    this.sendInitialData(ws, options);
  }

  /**
   * Unsubscribe from metrics
   */
  unsubscribeFromMetrics(
    ws: WebSocket,
    options: {
      subscriptionId: string;
    }
  ) {
    for (const [key, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((sub) => sub.id !== options.subscriptionId);
      if (filtered.length !== subs.length) {
        this.subscriptions.set(key, filtered);
        ws.send(
          JSON.stringify({
            type: 'unsubscribed',
            subscriptionId: options.subscriptionId,
          })
        );
        break;
      }
    }
  }

  /**
   * Push metric update to subscribers
   */
  async pushUpdate(data: {
    entityType: string;
    entityId: string;
    metrics: Record<string, any>;
  }) {
    const subscriptionKey = this.getSubscriptionKey(data.entityType, data.entityId);
    const globalKey = this.getSubscriptionKey(data.entityType);

    // Publish to Redis for distributed systems
    await this.publishRedis.publish(
      'metrics:update',
      JSON.stringify({
        entityType: data.entityType,
        entityId: data.entityId,
        metrics: data.metrics,
        timestamp: new Date(),
      })
    );

    // Send to specific entity subscribers
    this.sendToSubscribers(subscriptionKey, {
      type: 'update',
      entityType: data.entityType,
      entityId: data.entityId,
      metrics: data.metrics,
      timestamp: new Date(),
    });

    // Send to global entity type subscribers
    this.sendToSubscribers(globalKey, {
      type: 'update',
      entityType: data.entityType,
      entityId: data.entityId,
      metrics: data.metrics,
      timestamp: new Date(),
    });
  }

  /**
   * Get real-time statistics
   */
  async getRealtimeStats(entityType: string, entityId?: string) {
    const stats = await metricsService.getRealtimeMetrics(
      entityType,
      entityId || ''
    );

    return {
      entityType,
      entityId,
      stats,
      timestamp: new Date(),
    };
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: any) {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Get active subscriptions count
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const subs of this.subscriptions.values()) {
      count += subs.length;
    }
    return count;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.wss?.clients.size || 0;
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.wss) {
      this.wss.close();
    }
    this.redis.disconnect();
    this.publishRedis.disconnect();
  }

  // Helper methods

  private setupRedisSubscriptions() {
    // Subscribe to metric updates from other service instances
    this.redis.subscribe('metrics:update', (err) => {
      if (err) {
        console.error('Failed to subscribe to Redis channel:', err);
      }
    });

    this.redis.on('message', (channel, message) => {
      if (channel === 'metrics:update') {
        try {
          const data = JSON.parse(message);
          const subscriptionKey = this.getSubscriptionKey(
            data.entityType,
            data.entityId
          );
          const globalKey = this.getSubscriptionKey(data.entityType);

          this.sendToSubscribers(subscriptionKey, {
            type: 'update',
            ...data,
          });

          this.sendToSubscribers(globalKey, {
            type: 'update',
            ...data,
          });
        } catch (error) {
          console.error('Error processing Redis message:', error);
        }
      }
    });
  }

  private sendToSubscribers(key: string, message: any) {
    const subscribers = this.subscriptions.get(key);
    if (!subscribers) return;

    const filteredMessage = this.filterMessage(message, subscribers);

    subscribers.forEach((sub) => {
      if (sub.ws.readyState === WebSocket.OPEN) {
        const customMessage = sub.metrics
          ? this.filterMetrics(filteredMessage, sub.metrics)
          : filteredMessage;

        sub.ws.send(JSON.stringify(customMessage));
      }
    });
  }

  private filterMessage(message: any, subscribers: Subscription[]): any {
    // Can add filtering logic here if needed
    return message;
  }

  private filterMetrics(message: any, metrics: string[]): any {
    if (!message.metrics) return message;

    const filteredMetrics: Record<string, any> = {};
    for (const metric of metrics) {
      if (message.metrics[metric] !== undefined) {
        filteredMetrics[metric] = message.metrics[metric];
      }
    }

    return {
      ...message,
      metrics: filteredMetrics,
    };
  }

  private async sendInitialData(
    ws: WebSocket,
    options: {
      entityType: string;
      entityId?: string;
    }
  ) {
    try {
      const stats = await this.getRealtimeStats(options.entityType, options.entityId);
      ws.send(
        JSON.stringify({
          type: 'initial_data',
          data: stats,
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Failed to fetch initial data',
        })
      );
    }
  }

  private removeSubscription(ws: WebSocket) {
    for (const [key, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((sub) => sub.ws !== ws);
      if (filtered.length !== subs.length) {
        this.subscriptions.set(key, filtered);
      }
    }
  }

  private getSubscriptionKey(entityType: string, entityId?: string): string {
    return entityId ? `${entityType}:${entityId}` : entityType;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new RealtimeService();
