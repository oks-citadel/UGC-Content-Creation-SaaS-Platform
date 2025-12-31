import { prisma } from '../lib/prisma';
import { emailProvider } from '../providers/email';
import { smsProvider } from '../providers/sms';
import { pushProvider } from '../providers/push';
import { slackProvider } from '../providers/slack';
import { webhookProvider } from '../providers/webhook';
import { NotificationChannel, NotificationStatus, NotificationType, NotificationPriority } from '.prisma/notification-service-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import pino from 'pino';
import { config } from '../config';

const logger = pino({ name: 'notification-service' });

export interface SendNotificationInput {
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel[];
  priority?: NotificationPriority;
  subject?: string;
  template?: string;
  data?: Record<string, any>;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export class NotificationService {
  async send(input: SendNotificationInput): Promise<{ id: string; status: string }> {
    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          channel: input.channel,
          priority: input.priority || NotificationPriority.NORMAL,
          subject: input.subject,
          template: input.template,
          data: input.data || {},
          scheduledFor: input.scheduledFor,
          status: input.scheduledFor ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
          metadata: input.metadata || {},
        },
      });

      // If not scheduled, send immediately
      if (!input.scheduledFor) {
        await this.processNotification(notification.id);
      }

      return {
        id: notification.id,
        status: notification.status,
      };
    } catch (error: any) {
      logger.error({ error, input }, 'Failed to send notification');
      throw error;
    }
  }

  async sendBatch(inputs: SendNotificationInput[]): Promise<Array<{ id: string; status: string }>> {
    const results: Array<{ id: string; status: string }> = [];

    // Create all notification records
    const notifications = await prisma.$transaction(
      inputs.map(input =>
        prisma.notification.create({
          data: {
            userId: input.userId,
            type: input.type,
            channel: input.channel,
            priority: input.priority || NotificationPriority.NORMAL,
            subject: input.subject,
            template: input.template,
            data: input.data || {},
            scheduledFor: input.scheduledFor,
            status: input.scheduledFor ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
            metadata: input.metadata || {},
          },
        })
      )
    );

    // Process non-scheduled notifications in batches
    const batchSize = config.notification.batchSize;
    const immediateNotifications = notifications.filter(n => !n.scheduledFor);

    for (let i = 0; i < immediateNotifications.length; i += batchSize) {
      const batch = immediateNotifications.slice(i, i + batchSize);
      await Promise.all(batch.map(n => this.processNotification(n.id)));
    }

    return notifications.map(n => ({
      id: n.id,
      status: n.status,
    }));
  }

  async processNotification(notificationId: string): Promise<void> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      // Update status to sending
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENDING },
      });

      // Get user preferences if userId is provided
      let preferences: any = null;
      if (notification.userId) {
        preferences = await prisma.notificationPreference.findUnique({
          where: {
            userId_type: {
              userId: notification.userId,
              type: notification.type,
            },
          },
        });
      }

      // Send to each channel
      const results: any[] = [];
      for (const channel of notification.channel) {
        // Check if user has disabled this channel
        if (preferences && !this.isChannelEnabled(channel, preferences)) {
          logger.info({ notificationId, channel }, 'Channel disabled by user preference');
          continue;
        }

        const result = await this.sendToChannel(notification, channel);
        results.push(result);

        // Create log entry
        await prisma.notificationLog.create({
          data: {
            notificationId: notification.id,
            channel,
            status: result.success ? 'sent' : 'failed',
            provider: result.provider,
            providerId: result.messageId,
            response: result.response,
            error: result.error,
            sentAt: result.success ? new Date() : null,
          },
        });
      }

      // Update notification status
      const allFailed = results.every(r => !r.success);
      const allSucceeded = results.every(r => r.success);

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: allFailed
            ? NotificationStatus.FAILED
            : allSucceeded
            ? NotificationStatus.SENT
            : NotificationStatus.SENT,
          sentAt: allSucceeded ? new Date() : null,
          failedAt: allFailed ? new Date() : null,
          error: allFailed ? results[0]?.error : null,
        },
      });

      logger.info({ notificationId, results }, 'Notification processed');
    } catch (error: any) {
      logger.error({ error, notificationId }, 'Failed to process notification');

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          error: error.message,
          retryCount: { increment: 1 },
        },
      });
    }
  }

  private async sendToChannel(notification: any, channel: NotificationChannel): Promise<any> {
    try {
      const content = await this.renderTemplate(notification);

      switch (channel) {
        case NotificationChannel.EMAIL:
          return await this.sendEmail(notification, content);
        case NotificationChannel.SMS:
          return await this.sendSms(notification, content);
        case NotificationChannel.PUSH:
          return await this.sendPush(notification, content);
        case NotificationChannel.SLACK:
          return await this.sendSlack(notification, content);
        case NotificationChannel.WEBHOOK:
          return await this.sendWebhook(notification, content);
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendEmail(notification: any, content: string): Promise<any> {
    const to = notification.data?.email || notification.data?.to;
    if (!to) {
      throw new Error('Email address not provided');
    }

    const result = await emailProvider.send({
      to,
      subject: notification.subject || 'Notification from NEXUS',
      html: content,
    });

    return { ...result, provider: 'sendgrid' };
  }

  private async sendSms(notification: any, content: string): Promise<any> {
    const to = notification.data?.phone || notification.data?.to;
    if (!to) {
      throw new Error('Phone number not provided');
    }

    const result = await smsProvider.send({
      to,
      body: content,
    });

    return { ...result, provider: 'twilio' };
  }

  private async sendPush(notification: any, content: string): Promise<any> {
    const token = notification.data?.pushToken || notification.data?.token;
    if (!token) {
      throw new Error('Push token not provided');
    }

    const result = await pushProvider.send({
      token,
      title: notification.subject || 'Notification',
      body: content,
      data: notification.data,
    });

    return { ...result, provider: 'firebase' };
  }

  private async sendSlack(notification: any, content: string): Promise<any> {
    const channel = notification.data?.slackChannel || '#general';

    const result = await slackProvider.send({
      channel,
      text: content,
    });

    return { ...result, provider: 'slack' };
  }

  private async sendWebhook(notification: any, content: string): Promise<any> {
    const url = notification.data?.webhookUrl;
    if (!url) {
      throw new Error('Webhook URL not provided');
    }

    const result = await webhookProvider.send({
      url,
      body: {
        type: notification.type,
        data: notification.data,
        content,
      },
    });

    return { ...result, provider: 'webhook' };
  }

  private async renderTemplate(notification: any): Promise<string> {
    try {
      if (notification.template) {
        const templatePath = join(__dirname, '..', 'templates', `${notification.template}.html`);
        const templateContent = readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateContent);
        return template(notification.data || {});
      }

      // Fallback to simple text
      return notification.data?.message || notification.subject || 'You have a new notification';
    } catch (error) {
      logger.error({ error, template: notification.template }, 'Failed to render template');
      return notification.data?.message || notification.subject || 'You have a new notification';
    }
  }

  private isChannelEnabled(channel: NotificationChannel, preferences: any): boolean {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.email !== false;
      case NotificationChannel.SMS:
        return preferences.sms === true;
      case NotificationChannel.PUSH:
        return preferences.push !== false;
      case NotificationChannel.SLACK:
        return preferences.slack === true;
      case NotificationChannel.WEBHOOK:
        return preferences.webhook === true;
      default:
        return true;
    }
  }

  async processScheduledNotifications(): Promise<void> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.SCHEDULED,
          scheduledFor: {
            lte: new Date(),
          },
        },
        take: config.notification.batchSize,
      });

      logger.info({ count: notifications.length }, 'Processing scheduled notifications');

      for (const notification of notifications) {
        await this.processNotification(notification.id);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to process scheduled notifications');
    }
  }

  async retryFailedNotifications(): Promise<void> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: {
            lt: config.notification.maxRetries,
          },
          failedAt: {
            lte: new Date(Date.now() - config.notification.retryDelayMinutes * 60 * 1000),
          },
        },
        take: config.notification.batchSize,
      });

      logger.info({ count: notifications.length }, 'Retrying failed notifications');

      for (const notification of notifications) {
        await this.processNotification(notification.id);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to retry notifications');
    }
  }
}

export const notificationService = new NotificationService();
