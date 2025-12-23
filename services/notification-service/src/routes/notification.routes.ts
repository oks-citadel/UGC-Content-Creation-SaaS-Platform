import { Router } from 'express';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';
import { NotificationChannel, NotificationType, NotificationPriority } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();
const notificationService = new NotificationService();

// Validation schemas
const sendNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.nativeEnum(NotificationType),
  channel: z.array(z.nativeEnum(NotificationChannel)),
  priority: z.nativeEnum(NotificationPriority).optional(),
  subject: z.string().optional(),
  template: z.string().optional(),
  data: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const batchNotificationSchema = z.object({
  notifications: z.array(sendNotificationSchema),
});

const updatePreferenceSchema = z.object({
  type: z.nativeEnum(NotificationType),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  slack: z.boolean().optional(),
  webhook: z.boolean().optional(),
});

// Send single notification
router.post('/send', async (req, res, next) => {
  try {
    const input = sendNotificationSchema.parse(req.body);

    const result = await notificationService.send({
      ...input,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
    } as any);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Send batch notifications
router.post('/send/batch', async (req, res, next) => {
  try {
    const { notifications } = batchNotificationSchema.parse(req.body);

    const results = await notificationService.sendBatch(
      notifications.map(n => ({
        ...n,
        scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined,
      })) as any
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Get notification status
router.get('/:id', async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

// Get user notifications
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { page = '1', limit = '50', status, type } = req.query;

    const where: any = {
      userId: req.params.userId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: {
          logs: true,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Cancel scheduled notification
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: req.params.id,
        status: 'SCHEDULED',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

// Get user notification preferences
router.get('/preferences/:userId', async (req, res, next) => {
  try {
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: req.params.userId },
    });

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

// Update user notification preferences
router.put('/preferences/:userId', async (req, res, next) => {
  try {
    const input = updatePreferenceSchema.parse(req.body);

    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId: req.params.userId,
          type: input.type,
        },
      },
      create: {
        type: input.type,
        userId: req.params.userId,
        ...input,
      },
      update: input,
    });

    res.json({
      success: true,
      data: preference,
    });
  } catch (error) {
    next(error);
  }
});

// Get notification templates
router.get('/templates/list', async (req, res, next) => {
  try {
    const { type, channel } = req.query;

    const where: any = {
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (channel) {
      where.channel = channel;
    }

    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
});

// Get notification stats
router.get('/stats/:userId', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      userId: req.params.userId,
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [total, sent, failed, scheduled] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, status: 'SENT' } }),
      prisma.notification.count({ where: { ...where, status: 'FAILED' } }),
      prisma.notification.count({ where: { ...where, status: 'SCHEDULED' } }),
    ]);

    const byType = await prisma.notification.groupBy({
      by: ['type'],
      where,
      _count: true,
    });

    const byChannel = await prisma.notificationLog.groupBy({
      by: ['channel'],
      where: {
        notification: where,
      },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        total,
        sent,
        failed,
        scheduled,
        byType: byType.map(t => ({ type: t.type, count: t._count })),
        byChannel: byChannel.map(c => ({ channel: c.channel, count: c._count })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
