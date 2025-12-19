import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { oauthService } from '../services/oauth.service';
import { webhookService } from '../services/webhook.service';
import { IntegrationProvider } from '@prisma/client';

const router = Router();

// Validation schemas
const initiateOAuthSchema = z.object({
  userId: z.string().uuid(),
  provider: z.nativeEnum(IntegrationProvider),
  redirectUri: z.string().url(),
  metadata: z.record(z.any()).optional(),
});

const createWebhookSchema = z.object({
  integrationId: z.string().uuid(),
  url: z.string().url(),
  events: z.array(z.string()),
});

// Initiate OAuth flow
router.post('/oauth/initiate', async (req, res, next) => {
  try {
    const input = initiateOAuthSchema.parse(req.body);
    const result = await oauthService.initiateOAuth(
      input.userId,
      input.provider,
      input.redirectUri,
      input.metadata
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// OAuth callback
router.get('/oauth/callback/:provider', async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing code or state parameter',
        },
      });
    }

    const result = await oauthService.handleCallback(state as string, code as string);

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/integrations/callback?success=true&integrationId=${result.integrationId}`);
  } catch (error: any) {
    // Redirect to frontend with error
    res.redirect(`${process.env.FRONTEND_URL}/integrations/callback?success=false&error=${encodeURIComponent(error.message)}`);
  }
});

// Get user integrations
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { provider, isActive } = req.query;

    const where: any = {
      userId: req.params.userId,
    };

    if (provider) {
      where.provider = provider;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const integrations = await prisma.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        scope: true,
        metadata: true,
        lastSyncAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose tokens
      },
    });

    res.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    next(error);
  }
});

// Get integration by ID
router.get('/:id', async (req, res, next) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        userId: true,
        provider: true,
        name: true,
        isActive: true,
        scope: true,
        metadata: true,
        lastSyncAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        webhooks: true,
      },
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Integration not found',
        },
      });
    }

    res.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
});

// Update integration
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, isActive, metadata } = req.body;

    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(metadata && { metadata }),
      },
    });

    res.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
});

// Delete integration
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.integration.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: { message: 'Integration deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/:id/refresh', async (req, res, next) => {
  try {
    await oauthService.refreshToken(req.params.id);

    res.json({
      success: true,
      data: { message: 'Token refreshed successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// Create webhook
router.post('/webhooks', async (req, res, next) => {
  try {
    const input = createWebhookSchema.parse(req.body);
    const result = await webhookService.createWebhook(
      input.integrationId,
      input.url,
      input.events
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Get webhook deliveries
router.get('/webhooks/:webhookId/deliveries', async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query;

    const result = await webhookService.getWebhookDeliveries(
      req.params.webhookId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.deliveries,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Update webhook
router.patch('/webhooks/:webhookId', async (req, res, next) => {
  try {
    const { url, events, isActive } = req.body;

    const webhook = await prisma.webhook.update({
      where: { id: req.params.webhookId },
      data: {
        ...(url && { url }),
        ...(events && { events }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    next(error);
  }
});

// Delete webhook
router.delete('/webhooks/:webhookId', async (req, res, next) => {
  try {
    await prisma.webhook.delete({
      where: { id: req.params.webhookId },
    });

    res.json({
      success: true,
      data: { message: 'Webhook deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// Get integration sync logs
router.get('/:id/sync-logs', async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query;

    const [logs, total] = await Promise.all([
      prisma.integrationSyncLog.findMany({
        where: { integrationId: req.params.id },
        orderBy: { startedAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.integrationSyncLog.count({
        where: { integrationId: req.params.id },
      }),
    ]);

    res.json({
      success: true,
      data: logs,
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

export default router;
