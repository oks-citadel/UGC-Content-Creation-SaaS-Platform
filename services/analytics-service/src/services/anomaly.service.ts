import { PrismaClient } from '@prisma/client';
import { mean, standardDeviation } from 'simple-statistics';
import { subDays } from 'date-fns';
import metricsService from './metrics.service';
import config from '../config';
import { NotificationClient } from '@nexus/utils';

const prisma = new PrismaClient();
const notificationClient = new NotificationClient();

export interface AnomalyInput {
  metric: string;
  entityType: string;
  entityId: string;
  baseline: number;
  actual: number;
  deviation: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export interface AlertInput {
  userId: string;
  brandId?: string;
  name: string;
  metric: string;
  entityType: string;
  entityId?: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percent';
  threshold: number;
  channels: any;
  cooldown?: number;
}

class AnomalyService {
  /**
   * Detect anomalies in metric data
   */
  async detectAnomaly(
    entityType: string,
    entityId: string,
    metric: string,
    options: {
      lookbackDays?: number;
      thresholdStdDev?: number;
    } = {}
  ) {
    const lookbackDays = options.lookbackDays || 30;
    const thresholdStdDev = options.thresholdStdDev || config.anomaly.thresholdStdDev;

    // Get historical data
    const endDate = new Date();
    const startDate = subDays(endDate, lookbackDays);

    const snapshots = await metricsService.getMetrics({
      entityType,
      entityId,
      startDate,
      endDate,
      metrics: [metric],
    });

    if (!Array.isArray(snapshots) || snapshots.length < 7) {
      return null; // Not enough data for anomaly detection
    }

    // Extract metric values
    const values = snapshots
      .map((s: any) => this.extractMetricValue(s.metrics, metric))
      .filter((v: number) => typeof v === 'number' && !isNaN(v));

    if (values.length < 7) {
      return null;
    }

    // Calculate baseline statistics
    const baseline = mean(values);
    const stdDev = standardDeviation(values);

    // Get latest value
    const latestSnapshot = snapshots[snapshots.length - 1];
    const actual = this.extractMetricValue(latestSnapshot.metrics, metric);

    // Calculate deviation
    const deviation = Math.abs((actual - baseline) / stdDev);

    // Check if anomaly
    if (deviation >= thresholdStdDev) {
      const severity = this.calculateSeverity(deviation, thresholdStdDev);

      // Record anomaly
      const anomaly = await prisma.anomalyDetection.create({
        data: {
          metric,
          entityType,
          entityId,
          baseline,
          actual,
          deviation,
          severity,
          metadata: {
            stdDev,
            thresholdStdDev,
            sampleSize: values.length,
            lookbackDays,
          },
        },
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Batch detect anomalies for multiple entities
   */
  async detectAnomaliesBatch(
    entityType: string,
    metric: string,
    options?: {
      lookbackDays?: number;
      thresholdStdDev?: number;
    }
  ) {
    // Get all unique entity IDs
    const snapshots = await metricsService.getMetrics({
      entityType,
      startDate: subDays(new Date(), options?.lookbackDays || 30),
      endDate: new Date(),
    });

    if (!Array.isArray(snapshots)) {
      return [];
    }

    const entityIds = [...new Set(snapshots.map((s: any) => s.entityId))];

    // Detect anomalies for each entity
    const results = await Promise.allSettled(
      entityIds.map((entityId) =>
        this.detectAnomaly(entityType, entityId, metric, options)
      )
    );

    return results
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r: any) => r.value);
  }

  /**
   * Get anomalies
   */
  async getAnomalies(filters: {
    entityType?: string;
    entityId?: string;
    metric?: string;
    severity?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const anomalies = await prisma.anomalyDetection.findMany({
      where: {
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.entityId && { entityId: filters.entityId }),
        ...(filters.metric && { metric: filters.metric }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.resolved !== undefined && { resolved: filters.resolved }),
        ...(filters.startDate &&
          filters.endDate && {
            detectedAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      orderBy: { detectedAt: 'desc' },
      take: filters.limit || 50,
    });

    return anomalies;
  }

  /**
   * Resolve anomaly
   */
  async resolveAnomaly(id: string) {
    const anomaly = await prisma.anomalyDetection.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });

    return anomaly;
  }

  /**
   * Create alert
   */
  async createAlert(input: AlertInput) {
    const alert = await prisma.alert.create({
      data: {
        userId: input.userId,
        brandId: input.brandId,
        name: input.name,
        metric: input.metric,
        entityType: input.entityType,
        entityId: input.entityId,
        condition: input.condition,
        threshold: input.threshold,
        channels: input.channels,
        cooldown: input.cooldown || 3600,
        isActive: true,
      },
    });

    return alert;
  }

  /**
   * Update alert
   */
  async updateAlert(id: string, updates: Partial<AlertInput>) {
    const alert = await prisma.alert.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.metric && { metric: updates.metric }),
        ...(updates.condition && { condition: updates.condition }),
        ...(updates.threshold !== undefined && { threshold: updates.threshold }),
        ...(updates.channels && { channels: updates.channels }),
        ...(updates.cooldown !== undefined && { cooldown: updates.cooldown }),
      },
    });

    return alert;
  }

  /**
   * Get alert
   */
  async getAlert(id: string) {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        triggers: {
          orderBy: { triggeredAt: 'desc' },
          take: 10,
        },
      },
    });

    return alert;
  }

  /**
   * List alerts
   */
  async listAlerts(filters: {
    userId?: string;
    brandId?: string;
    entityType?: string;
    isActive?: boolean;
  }) {
    const alerts = await prisma.alert.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.brandId && { brandId: filters.brandId }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        triggers: {
          orderBy: { triggeredAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts;
  }

  /**
   * Delete alert
   */
  async deleteAlert(id: string) {
    await prisma.alert.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Check if alert should trigger
   */
  async checkAlert(alertId: string, currentValue: number) {
    const alert = await this.getAlert(alertId);
    if (!alert || !alert.isActive) {
      return false;
    }

    // Check cooldown
    if (alert.lastTriggered) {
      const cooldownEnd = new Date(
        alert.lastTriggered.getTime() + alert.cooldown * 1000
      );
      if (new Date() < cooldownEnd) {
        return false; // Still in cooldown period
      }
    }

    // Check condition
    let shouldTrigger = false;

    switch (alert.condition) {
      case 'greater_than':
        shouldTrigger = currentValue > alert.threshold;
        break;
      case 'less_than':
        shouldTrigger = currentValue < alert.threshold;
        break;
      case 'equals':
        shouldTrigger = currentValue === alert.threshold;
        break;
      case 'change_percent':
        // Get previous value to calculate change
        const previous = await this.getPreviousValue(
          alert.entityType,
          alert.entityId || '',
          alert.metric
        );
        if (previous !== null) {
          const changePercent = ((currentValue - previous) / previous) * 100;
          shouldTrigger = Math.abs(changePercent) >= alert.threshold;
        }
        break;
    }

    return shouldTrigger;
  }

  /**
   * Trigger alert
   */
  async triggerAlert(alertId: string, value: number, metadata?: any) {
    const alert = await this.getAlert(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Create trigger record
    const trigger = await prisma.alertTrigger.create({
      data: {
        alertId,
        value,
        threshold: alert.threshold,
        metadata,
      },
    });

    // Update alert last triggered
    await prisma.alert.update({
      where: { id: alertId },
      data: { lastTriggered: new Date() },
    });

    // Send notifications
    await this.sendAlertNotifications(alert, value, metadata);

    return trigger;
  }

  /**
   * Get alert triggers
   */
  async getAlertTriggers(alertId: string, limit: number = 20) {
    const triggers = await prisma.alertTrigger.findMany({
      where: { alertId },
      orderBy: { triggeredAt: 'desc' },
      take: limit,
    });

    return triggers;
  }

  // Helper methods

  private extractMetricValue(metrics: any, metric: string): number {
    const value = metric.split('.').reduce((obj, key) => obj?.[key], metrics);
    return typeof value === 'number' ? value : 0;
  }

  private calculateSeverity(
    deviation: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = deviation / threshold;

    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private async getPreviousValue(
    entityType: string,
    entityId: string,
    metric: string
  ): Promise<number | null> {
    const snapshots = await metricsService.getMetrics({
      entityType,
      entityId,
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
      metrics: [metric],
    });

    if (!Array.isArray(snapshots) || snapshots.length < 2) {
      return null;
    }

    const previousSnapshot = snapshots[snapshots.length - 2];
    return this.extractMetricValue(previousSnapshot.metrics, metric);
  }

  private async sendAlertNotifications(alert: any, value: number, metadata?: any) {
    const channels = alert.channels;

    try {
      // Use the unified sendAlert method for all channels at once
      const results = await notificationClient.sendAlert({
        name: alert.name,
        metric: alert.metric,
        value,
        threshold: alert.threshold,
        condition: alert.condition,
        severity: this.getSeverityFromDeviation(value, alert.threshold),
        channels: {
          email: channels.email,
          slack: channels.slack ? {
            channel: channels.slack.channel || '#alerts',
            webhookUrl: channels.slack.webhook,
          } : undefined,
          webhook: channels.webhook,
        },
        metadata: {
          alertId: alert.id,
          entityType: alert.entityType,
          entityId: alert.entityId,
          triggeredAt: new Date().toISOString(),
          ...metadata,
        },
      });

      console.log(`Alert notifications sent for ${alert.name}: ${results.length} channels notified`);
    } catch (error) {
      console.error(`Failed to send alert notifications for ${alert.name}:`, error);
      // Don't throw - alert trigger was recorded, just notifications failed
    }
  }

  private getSeverityFromDeviation(value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = Math.abs(value / threshold);
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private async sendEmailAlert(alert: any, value: number, emails: string[]) {
    try {
      await notificationClient.sendAlert({
        name: alert.name,
        metric: alert.metric,
        value,
        threshold: alert.threshold,
        condition: alert.condition,
        severity: this.getSeverityFromDeviation(value, alert.threshold),
        channels: {
          email: emails,
        },
        metadata: {
          alertId: alert.id,
          entityType: alert.entityType,
          entityId: alert.entityId,
        },
      });
      console.log(`Email alert sent to ${emails.join(', ')} for alert: ${alert.name}`);
    } catch (error) {
      console.error(`Failed to send email alert to ${emails.join(', ')}:`, error);
    }
  }

  private async sendSlackAlert(alert: any, value: number, slack: any) {
    try {
      await notificationClient.sendAlert({
        name: alert.name,
        metric: alert.metric,
        value,
        threshold: alert.threshold,
        condition: alert.condition,
        severity: this.getSeverityFromDeviation(value, alert.threshold),
        channels: {
          slack: {
            channel: slack.channel || '#alerts',
            webhookUrl: slack.webhook,
          },
        },
        metadata: {
          alertId: alert.id,
          entityType: alert.entityType,
          entityId: alert.entityId,
        },
      });
      console.log(`Slack alert sent for: ${alert.name}`);
    } catch (error) {
      console.error(`Failed to send Slack alert:`, error);
    }
  }

  private async sendWebhookAlert(alert: any, value: number, webhookUrl: string) {
    try {
      await notificationClient.sendAlert({
        name: alert.name,
        metric: alert.metric,
        value,
        threshold: alert.threshold,
        condition: alert.condition,
        severity: this.getSeverityFromDeviation(value, alert.threshold),
        channels: {
          webhook: webhookUrl,
        },
        metadata: {
          alertId: alert.id,
          entityType: alert.entityType,
          entityId: alert.entityId,
        },
      });
      console.log(`Webhook alert sent to ${webhookUrl} for: ${alert.name}`);
    } catch (error) {
      console.error(`Failed to send webhook alert to ${webhookUrl}:`, error);
    }
  }
}

export default new AnomalyService();
