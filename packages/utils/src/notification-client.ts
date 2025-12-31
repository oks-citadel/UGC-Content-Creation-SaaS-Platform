// =============================================================================
// Notification Service Client
// =============================================================================
// A client for communicating with the notification-service from other services
// Supports email (SendGrid), Slack, and webhook notifications

import { retry } from './retry';

export type NotificationType =
  | 'SYSTEM'
  | 'MARKETING'
  | 'TRANSACTIONAL'
  | 'ALERT'
  | 'REMINDER'
  | 'BILLING'
  | 'SECURITY'
  | 'CAMPAIGN'
  | 'CREATOR'
  | 'CONTENT';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'SLACK' | 'WEBHOOK';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface SendNotificationOptions {
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel[];
  priority?: NotificationPriority;
  subject?: string;
  template?: string;
  data?: Record<string, unknown>;
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  id: string;
  status: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  data?: Record<string, unknown>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
  }>;
}

export interface SlackOptions {
  channel?: string;
  text: string;
  blocks?: unknown[];
  attachments?: unknown[];
  username?: string;
  iconEmoji?: string;
}

export interface WebhookOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface NotificationClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  apiKey?: string;
}

/**
 * NotificationClient provides a unified interface for sending notifications
 * through the notification-service or directly via providers.
 */
export class NotificationClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly apiKey?: string;

  constructor(config?: Partial<NotificationClientConfig>) {
    this.baseUrl = config?.baseUrl || process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3008';
    this.timeout = config?.timeout || 10000;
    this.retries = config?.retries || 3;
    this.apiKey = config?.apiKey || process.env.NOTIFICATION_SERVICE_API_KEY;
  }

  /**
   * Send a notification through the notification service
   */
  async send(options: SendNotificationOptions): Promise<NotificationResult> {
    return retry(
      async () => {
        const response = await this.makeRequest('/notifications/send', 'POST', {
          ...options,
          scheduledFor: options.scheduledFor?.toISOString(),
        });

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to send notification');
        }

        return response.data as NotificationResult;
      },
      {
        maxAttempts: this.retries,
        initialDelayMs: 1000,
        backoffFactor: 2,
        jitter: true,
      }
    );
  }

  /**
   * Send email notification
   */
  async sendEmail(options: EmailOptions): Promise<NotificationResult> {
    return this.send({
      type: 'TRANSACTIONAL',
      channel: ['EMAIL'],
      subject: options.subject,
      template: options.template,
      data: {
        email: options.to,
        to: options.to,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        attachments: options.attachments,
        ...options.data,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(params: {
    email: string;
    resetToken: string;
    userName?: string;
    expiresIn?: string;
  }): Promise<NotificationResult> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://app.nexusplatform.io'}/reset-password?token=${params.resetToken}`;

    return this.send({
      type: 'SECURITY',
      channel: ['EMAIL'],
      priority: 'HIGH',
      subject: 'Reset Your Password',
      template: 'password-reset',
      data: {
        email: params.email,
        to: params.email,
        resetUrl,
        userName: params.userName || 'there',
        expiresIn: params.expiresIn || '1 hour',
      },
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(params: {
    email: string;
    verificationCode: string;
    userName?: string;
  }): Promise<NotificationResult> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'https://app.nexusplatform.io'}/verify-email?code=${params.verificationCode}`;

    return this.send({
      type: 'SECURITY',
      channel: ['EMAIL'],
      priority: 'HIGH',
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      data: {
        email: params.email,
        to: params.email,
        verifyUrl,
        verificationCode: params.verificationCode,
        userName: params.userName || 'there',
      },
    });
  }

  /**
   * Send MFA OTP email for two-factor authentication
   */
  async sendMfaOtpEmail(params: {
    email: string;
    otp: string;
    userName?: string;
    expiresInMinutes?: number;
  }): Promise<NotificationResult> {
    return this.send({
      type: 'SECURITY',
      channel: ['EMAIL'],
      priority: 'URGENT',
      subject: 'Your Verification Code',
      template: 'mfa-otp',
      data: {
        email: params.email,
        to: params.email,
        otp: params.otp,
        userName: params.userName || 'there',
        expiresInMinutes: params.expiresInMinutes || 10,
      },
    });
  }

  /**
   * Send organization invitation email
   */
  async sendInvitationEmail(params: {
    email: string;
    invitationToken: string;
    organizationName: string;
    inviterName?: string;
    role: string;
  }): Promise<NotificationResult> {
    const inviteUrl = `${process.env.FRONTEND_URL || 'https://app.nexusplatform.io'}/accept-invite?token=${params.invitationToken}`;

    return this.send({
      type: 'TRANSACTIONAL',
      channel: ['EMAIL'],
      priority: 'NORMAL',
      subject: `You've been invited to join ${params.organizationName}`,
      template: 'organization-invite',
      data: {
        email: params.email,
        to: params.email,
        inviteUrl,
        organizationName: params.organizationName,
        inviterName: params.inviterName || 'A team member',
        role: params.role,
      },
    });
  }

  /**
   * Send billing dunning notification
   */
  async sendDunningNotification(params: {
    email: string;
    userId: string;
    userName?: string;
    invoiceNumber: string;
    amount: number;
    currency?: string;
    dueDate?: Date;
    attempt: number;
    paymentUrl?: string;
  }): Promise<NotificationResult> {
    const updatePaymentUrl = params.paymentUrl ||
      `${process.env.FRONTEND_URL || 'https://app.nexusplatform.io'}/billing/payment-methods`;

    let subject = 'Payment Failed - Action Required';
    let template = 'dunning-notification';

    if (params.attempt === 1) {
      subject = 'Payment Failed - Please Update Your Payment Method';
    } else if (params.attempt === 2) {
      subject = 'Second Notice: Payment Still Pending';
    } else if (params.attempt >= 3) {
      subject = 'Final Notice: Account at Risk of Suspension';
      template = 'dunning-final-notice';
    }

    return this.send({
      userId: params.userId,
      type: 'BILLING',
      channel: ['EMAIL'],
      priority: params.attempt >= 3 ? 'URGENT' : 'HIGH',
      subject,
      template,
      data: {
        email: params.email,
        to: params.email,
        userName: params.userName || 'there',
        invoiceNumber: params.invoiceNumber,
        amount: params.amount,
        currency: params.currency || 'USD',
        dueDate: params.dueDate?.toISOString(),
        attempt: params.attempt,
        updatePaymentUrl,
      },
    });
  }

  /**
   * Send trial ending notification
   */
  async sendTrialEndingNotification(params: {
    email: string;
    userId: string;
    userName?: string;
    planName: string;
    trialEndDate: Date;
    daysRemaining: number;
    upgradeUrl?: string;
  }): Promise<NotificationResult> {
    const upgradeUrl = params.upgradeUrl ||
      `${process.env.FRONTEND_URL || 'https://app.nexusplatform.io'}/billing/upgrade`;

    return this.send({
      userId: params.userId,
      type: 'BILLING',
      channel: ['EMAIL'],
      priority: params.daysRemaining <= 1 ? 'HIGH' : 'NORMAL',
      subject: `Your trial ends in ${params.daysRemaining} day${params.daysRemaining !== 1 ? 's' : ''}`,
      template: 'trial-ending',
      data: {
        email: params.email,
        to: params.email,
        userName: params.userName || 'there',
        planName: params.planName,
        trialEndDate: params.trialEndDate.toISOString(),
        daysRemaining: params.daysRemaining,
        upgradeUrl,
      },
    });
  }

  /**
   * Send analytics report via email
   */
  async sendReportEmail(params: {
    recipients: string[];
    reportName: string;
    reportUrl: string;
    generatedAt?: Date;
    summary?: string;
  }): Promise<NotificationResult> {
    return this.send({
      type: 'TRANSACTIONAL',
      channel: ['EMAIL'],
      priority: 'NORMAL',
      subject: `Your Report is Ready: ${params.reportName}`,
      template: 'report-ready',
      data: {
        email: params.recipients,
        to: params.recipients,
        reportName: params.reportName,
        reportUrl: params.reportUrl,
        generatedAt: (params.generatedAt || new Date()).toISOString(),
        summary: params.summary || 'Your scheduled report has been generated and is ready for download.',
      },
    });
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(options: SlackOptions): Promise<NotificationResult> {
    return this.send({
      type: 'ALERT',
      channel: ['SLACK'],
      priority: 'HIGH',
      data: {
        slackChannel: options.channel,
        message: options.text,
        ...options,
      },
    });
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(options: WebhookOptions): Promise<NotificationResult> {
    return this.send({
      type: 'ALERT',
      channel: ['WEBHOOK'],
      data: {
        webhookUrl: options.url,
        method: options.method,
        headers: options.headers,
        body: options.body,
        timeout: options.timeout,
      },
    });
  }

  /**
   * Send alert notification (email, slack, and/or webhook)
   */
  async sendAlert(params: {
    name: string;
    metric: string;
    value: number;
    threshold: number;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    channels: {
      email?: string[];
      slack?: { channel: string; webhookUrl?: string };
      webhook?: string;
    };
    metadata?: Record<string, unknown>;
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const alertMessage = `Alert: ${params.name}\nMetric: ${params.metric}\nValue: ${params.value} (threshold: ${params.condition} ${params.threshold})\nSeverity: ${params.severity}`;

    // Send email alert
    if (params.channels.email && params.channels.email.length > 0) {
      const emailResult = await this.send({
        type: 'ALERT',
        channel: ['EMAIL'],
        priority: params.severity === 'critical' ? 'URGENT' : params.severity === 'high' ? 'HIGH' : 'NORMAL',
        subject: `[${params.severity.toUpperCase()}] Alert: ${params.name}`,
        template: 'alert-notification',
        data: {
          email: params.channels.email,
          to: params.channels.email,
          alertName: params.name,
          metric: params.metric,
          value: params.value,
          threshold: params.threshold,
          condition: params.condition,
          severity: params.severity,
          message: alertMessage,
          ...params.metadata,
        },
      });
      results.push(emailResult);
    }

    // Send Slack alert
    if (params.channels.slack) {
      const slackResult = await this.send({
        type: 'ALERT',
        channel: ['SLACK'],
        priority: params.severity === 'critical' ? 'URGENT' : 'HIGH',
        data: {
          slackChannel: params.channels.slack.channel,
          webhookUrl: params.channels.slack.webhookUrl,
          message: alertMessage,
          text: alertMessage,
          attachments: [{
            color: params.severity === 'critical' ? '#dc3545' :
                   params.severity === 'high' ? '#fd7e14' :
                   params.severity === 'medium' ? '#ffc107' : '#28a745',
            title: `Alert: ${params.name}`,
            fields: [
              { title: 'Metric', value: params.metric, short: true },
              { title: 'Value', value: String(params.value), short: true },
              { title: 'Threshold', value: `${params.condition} ${params.threshold}`, short: true },
              { title: 'Severity', value: params.severity.toUpperCase(), short: true },
            ],
            footer: 'NEXUS Platform',
            ts: Math.floor(Date.now() / 1000),
          }],
        },
      });
      results.push(slackResult);
    }

    // Send webhook alert
    if (params.channels.webhook) {
      const webhookResult = await this.send({
        type: 'ALERT',
        channel: ['WEBHOOK'],
        data: {
          webhookUrl: params.channels.webhook,
          body: {
            event: 'alert.triggered',
            alert: {
              name: params.name,
              metric: params.metric,
              value: params.value,
              threshold: params.threshold,
              condition: params.condition,
              severity: params.severity,
            },
            timestamp: new Date().toISOString(),
            ...params.metadata,
          },
        },
      });
      results.push(webhookResult);
    }

    return results;
  }

  /**
   * Get notification status
   */
  async getStatus(notificationId: string): Promise<{ id: string; status: string }> {
    const response = await this.makeRequest(`/notifications/${notificationId}`, 'GET');

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get notification status');
    }

    return response.data as { id: string; status: string };
  }

  /**
   * Make HTTP request to notification service
   */
  private async makeRequest(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'REQUEST_FAILED',
            message: data.error?.message || `Request failed with status ${response.status}`,
          },
        };
      }

      return { success: true, data: data.data || data };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: `Request timed out after ${this.timeout}ms`,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }
}

// Export a default singleton instance
export const notificationClient = new NotificationClient();

// Export factory function for custom configurations
export function createNotificationClient(config?: Partial<NotificationClientConfig>): NotificationClient {
  return new NotificationClient(config);
}
