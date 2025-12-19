import admin from 'firebase-admin';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'push-provider' });

export interface PushMessage {
  token: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  icon?: string;
  badge?: number;
  sound?: string;
  clickAction?: string;
}

export class PushProvider {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (!config.firebase.projectId || !config.firebase.privateKey) {
        logger.warn('Firebase credentials not configured, push notifications disabled');
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey,
          }),
        });

        this.initialized = true;
        logger.info('Firebase initialized successfully');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Firebase');
    }
  }

  async send(message: PushMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }

      const tokens = Array.isArray(message.token) ? message.token : [message.token];

      if (tokens.length === 0) {
        throw new Error('No tokens provided');
      }

      const payload: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: message.title,
          body: message.body,
          imageUrl: message.imageUrl,
        },
        data: message.data,
        apns: message.badge !== undefined ? {
          payload: {
            aps: {
              badge: message.badge,
              sound: message.sound || 'default',
            },
          },
        } : undefined,
        android: {
          notification: {
            icon: message.icon,
            sound: message.sound,
            clickAction: message.clickAction,
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);

      logger.info(
        { successCount: response.successCount, failureCount: response.failureCount },
        'Push notification sent'
      );

      if (response.failureCount > 0) {
        const errors = response.responses
          .filter(r => !r.success)
          .map(r => r.error?.message)
          .join(', ');

        return {
          success: response.successCount > 0,
          error: errors,
        };
      }

      return {
        success: true,
        messageId: response.responses[0]?.messageId,
      };
    } catch (error: any) {
      logger.error({ error, tokens: message.token }, 'Failed to send push notification');

      return {
        success: false,
        error: error.message || 'Failed to send push notification',
      };
    }
  }

  async sendBatch(messages: PushMessage[]): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
    const results: Array<{ success: boolean; messageId?: string; error?: string }> = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return results;
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }

      const payload: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data,
      };

      const messageId = await admin.messaging().send(payload);

      logger.info({ topic, messageId }, 'Push notification sent to topic');

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      logger.error({ error, topic }, 'Failed to send push notification to topic');

      return {
        success: false,
        error: error.message || 'Failed to send push notification to topic',
      };
    }
  }
}

export const pushProvider = new PushProvider();
