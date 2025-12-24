// =============================================================================
// API Gateway Routes
// =============================================================================

import { Express, Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { config } from '../config';
import { logger } from '../utils/logger';

const proxyOptions = (target: string, pathRewrite?: Record<string, string>): Options => ({
  target,
  changeOrigin: true,
  pathRewrite,
  logLevel: 'warn',
  onProxyReq: (proxyReq, req) => {
    // Forward user information to downstream services
    if ((req as any).user) {
      proxyReq.setHeader('X-User-ID', (req as any).user.sub);
      proxyReq.setHeader('X-User-Email', (req as any).user.email);
      proxyReq.setHeader('X-User-Role', (req as any).user.role);
    }
    if ((req as any).organizationId) {
      proxyReq.setHeader('X-Organization-ID', (req as any).organizationId);
    }
    // Forward request ID
    const requestId = req.headers['x-request-id'];
    if (requestId) {
      proxyReq.setHeader('X-Request-ID', requestId);
    }
  },
  onError: (err, req, res) => {
    logger.error({
      message: 'Proxy error',
      error: err.message,
      target,
      path: req.url,
    });
    (res as any).status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
      },
    });
  },
});

export function setupRoutes(app: Express): void {
  const router: Router = Router();

  // Auth Service
  router.use(
    '/auth',
    createProxyMiddleware(proxyOptions(config.services.auth, {
      '^/api/v1/auth': '/api/v1/auth',
    }))
  );

  // User Service
  router.use(
    '/users',
    createProxyMiddleware(proxyOptions(config.services.user, {
      '^/api/v1/users': '/api/v1/users',
    }))
  );

  router.use(
    '/organizations',
    createProxyMiddleware(proxyOptions(config.services.user, {
      '^/api/v1/organizations': '/api/v1/organizations',
    }))
  );

  // Campaign Service
  router.use(
    '/campaigns',
    createProxyMiddleware(proxyOptions(config.services.campaign, {
      '^/api/v1/campaigns': '/api/v1/campaigns',
    }))
  );

  router.use(
    '/briefs',
    createProxyMiddleware(proxyOptions(config.services.campaign, {
      '^/api/v1/briefs': '/api/v1/briefs',
    }))
  );

  router.use(
    '/deliverables',
    createProxyMiddleware(proxyOptions(config.services.campaign, {
      '^/api/v1/deliverables': '/api/v1/deliverables',
    }))
  );

  // Content Service
  router.use(
    '/content',
    createProxyMiddleware(proxyOptions(config.services.content, {
      '^/api/v1/content': '/api/v1/content',
    }))
  );

  router.use(
    '/uploads',
    createProxyMiddleware(proxyOptions(config.services.content, {
      '^/api/v1/uploads': '/api/v1/uploads',
    }))
  );

  router.use(
    '/ai',
    createProxyMiddleware(proxyOptions(config.services.content, {
      '^/api/v1/ai': '/api/v1/ai',
    }))
  );

  // Creator Service
  router.use(
    '/creators',
    createProxyMiddleware(proxyOptions(config.services.creator, {
      '^/api/v1/creators': '/api/v1/creators',
    }))
  );

  router.use(
    '/portfolios',
    createProxyMiddleware(proxyOptions(config.services.creator, {
      '^/api/v1/portfolios': '/api/v1/portfolios',
    }))
  );

  // Marketplace Service
  router.use(
    '/marketplace',
    createProxyMiddleware(proxyOptions(config.services.marketplace, {
      '^/api/v1/marketplace': '/api/v1/marketplace',
    }))
  );

  router.use(
    '/opportunities',
    createProxyMiddleware(proxyOptions(config.services.marketplace, {
      '^/api/v1/opportunities': '/api/v1/opportunities',
    }))
  );

  // Commerce Service
  router.use(
    '/products',
    createProxyMiddleware(proxyOptions(config.services.commerce, {
      '^/api/v1/products': '/api/v1/products',
    }))
  );

  router.use(
    '/galleries',
    createProxyMiddleware(proxyOptions(config.services.commerce, {
      '^/api/v1/galleries': '/api/v1/galleries',
    }))
  );

  router.use(
    '/orders',
    createProxyMiddleware(proxyOptions(config.services.commerce, {
      '^/api/v1/orders': '/api/v1/orders',
    }))
  );

  // Analytics Service
  router.use(
    '/analytics',
    createProxyMiddleware(proxyOptions(config.services.analytics, {
      '^/api/v1/analytics': '/api/v1/analytics',
    }))
  );

  router.use(
    '/dashboards',
    createProxyMiddleware(proxyOptions(config.services.analytics, {
      '^/api/v1/dashboards': '/api/v1/dashboards',
    }))
  );

  router.use(
    '/reports',
    createProxyMiddleware(proxyOptions(config.services.analytics, {
      '^/api/v1/reports': '/api/v1/reports',
    }))
  );

  // Notification Service
  router.use(
    '/notifications',
    createProxyMiddleware(proxyOptions(config.services.notification, {
      '^/api/v1/notifications': '/api/v1/notifications',
    }))
  );

  // Integration Service
  router.use(
    '/integrations',
    createProxyMiddleware(proxyOptions(config.services.integration, {
      '^/api/v1/integrations': '/api/v1/integrations',
    }))
  );

  router.use(
    '/webhooks',
    createProxyMiddleware(proxyOptions(config.services.integration, {
      '^/api/v1/webhooks': '/api/v1/webhooks',
    }))
  );

  // Billing Service
  router.use(
    '/billing',
    createProxyMiddleware(proxyOptions(config.services.billing, {
      '^/api/v1/billing': '/api/v1/billing',
    }))
  );

  router.use(
    '/subscriptions',
    createProxyMiddleware(proxyOptions(config.services.billing, {
      '^/api/v1/subscriptions': '/api/v1/subscriptions',
    }))
  );

  // Mount router
  app.use('/api/v1', router);

  // API documentation redirect
  app.get('/docs', (req, res) => {
    res.redirect('/api/v1/docs');
  });

  logger.info('Routes configured');
}
