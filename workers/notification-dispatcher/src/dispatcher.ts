import pino from 'pino';
import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { EmailProvider, EmailOptions } from './providers/email-provider';
import { SMSProvider, SMSOptions } from './providers/sms-provider';
import { PushProvider, PushOptions } from './providers/push-provider';
import { SlackProvider, SlackOptions } from './providers/slack-provider';
import { WebhookProvider, WebhookOptions } from './providers/webhook-provider';

const logger = pino();

export type NotificationType = 'email' | 'sms' | 'push' | 'slack' | 'webhook';

export interface NotificationOptions {
  type: NotificationType;
  template?: string;
  templateData?: Record<string, any>;
  email?: EmailOptions;
  sms?: SMSOptions;
  push?: PushOptions;
  slack?: SlackOptions;
  webhook?: WebhookOptions;
}

export class NotificationDispatcher {
  private emailProvider: EmailProvider;
  private smsProvider: SMSProvider;
  private pushProvider: PushProvider;
  private slackProvider: SlackProvider;
  private webhookProvider: WebhookProvider;
  private templateCache: Map<string, HandlebarsTemplateDelegate>;
  private logger = logger.child({ component: 'NotificationDispatcher' });

  constructor() {
    this.emailProvider = new EmailProvider();
    this.smsProvider = new SMSProvider();
    this.pushProvider = new PushProvider();
    this.slackProvider = new SlackProvider();
    this.webhookProvider = new WebhookProvider();
    this.templateCache = new Map();
  }

  async sendEmail(options: EmailOptions, template?: string, data?: Record<string, any>): Promise<void> {
    this.logger.info({ to: options.to, template }, 'Sending email notification');

    try {
      let html = options.html;

      if (template && data) {
        html = await this.renderTemplate(template, data);
      }

      await this.emailProvider.send({
        ...options,
        html,
      });

      this.logger.info({ to: options.to }, 'Email notification sent');
    } catch (error) {
      this.logger.error({ error, to: options.to }, 'Failed to send email notification');
      throw error;
    }
  }

  async sendSMS(options: SMSOptions): Promise<void> {
    this.logger.info({ to: options.to }, 'Sending SMS notification');

    try {
      await this.smsProvider.send(options);
      this.logger.info({ to: options.to }, 'SMS notification sent');
    } catch (error) {
      this.logger.error({ error, to: options.to }, 'Failed to send SMS notification');
      throw error;
    }
  }

  async sendPush(options: PushOptions): Promise<void> {
    this.logger.info('Sending push notification');

    try {
      await this.pushProvider.send(options);
      this.logger.info('Push notification sent');
    } catch (error) {
      this.logger.error({ error }, 'Failed to send push notification');
      throw error;
    }
  }

  async sendSlack(options: SlackOptions): Promise<void> {
    this.logger.info({ channel: options.channel }, 'Sending Slack notification');

    try {
      await this.slackProvider.send(options);
      this.logger.info({ channel: options.channel }, 'Slack notification sent');
    } catch (error) {
      this.logger.error({ error, channel: options.channel }, 'Failed to send Slack notification');
      throw error;
    }
  }

  async sendWebhook(options: WebhookOptions): Promise<void> {
    this.logger.info({ url: options.url }, 'Sending webhook notification');

    try {
      await this.webhookProvider.send(options);
      this.logger.info({ url: options.url }, 'Webhook notification sent');
    } catch (error) {
      this.logger.error({ error, url: options.url }, 'Failed to send webhook notification');
      throw error;
    }
  }

  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    let template = this.templateCache.get(templateName);

    if (!template) {
      const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      template = Handlebars.compile(templateContent);
      this.templateCache.set(templateName, template);
    }

    return template(data);
  }

  async dispatch(options: NotificationOptions): Promise<void> {
    this.logger.info({ type: options.type }, 'Dispatching notification');

    try {
      switch (options.type) {
        case 'email':
          if (!options.email) {
            throw new Error('Email options are required');
          }
          await this.sendEmail(options.email, options.template, options.templateData);
          break;

        case 'sms':
          if (!options.sms) {
            throw new Error('SMS options are required');
          }
          await this.sendSMS(options.sms);
          break;

        case 'push':
          if (!options.push) {
            throw new Error('Push options are required');
          }
          await this.sendPush(options.push);
          break;

        case 'slack':
          if (!options.slack) {
            throw new Error('Slack options are required');
          }
          await this.sendSlack(options.slack);
          break;

        case 'webhook':
          if (!options.webhook) {
            throw new Error('Webhook options are required');
          }
          await this.sendWebhook(options.webhook);
          break;

        default:
          throw new Error(`Unknown notification type: ${options.type}`);
      }

      this.logger.info({ type: options.type }, 'Notification dispatched successfully');
    } catch (error) {
      this.logger.error({ error, type: options.type }, 'Failed to dispatch notification');
      throw error;
    }
  }

  async dispatchBatch(notifications: NotificationOptions[]): Promise<void> {
    this.logger.info({ count: notifications.length }, 'Dispatching batch notifications');

    const results = await Promise.allSettled(
      notifications.map((notification) => this.dispatch(notification))
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;

    this.logger.info(
      { total: notifications.length, succeeded, failed },
      'Batch notifications completed'
    );

    if (failed > 0) {
      throw new Error(`${failed} out of ${notifications.length} notifications failed`);
    }
  }
}
