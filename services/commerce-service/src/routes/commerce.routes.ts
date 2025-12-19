import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  validateProduct,
  validateGallery,
  validateProductTag,
  validateAttributionEvent,
  validateCheckout,
  validateProcessOrder,
  validateUUID,
  validatePagination,
  validateDateRange,
} from '../middleware/validation';
import prisma from '../config/database';
import galleryService from '../services/gallery.service';
import taggingService from '../services/tagging.service';
import attributionService from '../services/attribution.service';
import checkoutService from '../services/checkout.service';
import { ShopifyIntegration } from '../integrations/shopify';
import { WooCommerceIntegration } from '../integrations/woocommerce';
import logger from '../config/logger';

const router = Router();

// ==================== PRODUCT ROUTES ====================

/**
 * Get all products
 */
router.get(
  '/products',
  authenticate,
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50, offset = 0, source, search } = req.query;

    const where: any = {
      tenant_id: req.tenantId,
      ...(source && { source }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const products = await prisma.product.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { created_at: 'desc' },
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: products,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  })
);

/**
 * Get product by ID
 */
router.get(
  '/products/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        tenant_id: req.tenantId,
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  })
);

/**
 * Create product manually
 */
router.post(
  '/products',
  authenticate,
  validateProduct,
  asyncHandler(async (req: Request, res: Response) => {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        source: 'manual',
        tenant_id: req.tenantId,
        created_by: req.user?.userId,
      },
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  })
);

/**
 * Sync products from e-commerce platform
 */
router.post(
  '/products/sync',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { source, credentials } = req.body;

    if (!['shopify', 'woocommerce'].includes(source)) {
      res.status(400).json({
        success: false,
        message: 'Invalid source. Must be shopify or woocommerce',
      });
      return;
    }

    let products;

    if (source === 'shopify') {
      const shopify = new ShopifyIntegration(req.tenantId!);
      await shopify.initialize(credentials);
      products = await shopify.syncProducts();
    } else {
      const woo = new WooCommerceIntegration(req.tenantId!);
      await woo.initialize(credentials);
      products = await woo.syncProducts();
    }

    res.json({
      success: true,
      data: {
        synced: products.length,
        products,
      },
    });
  })
);

// ==================== GALLERY ROUTES ====================

/**
 * Get all galleries
 */
router.get(
  '/galleries',
  authenticate,
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50, offset = 0, is_active } = req.query;

    const galleries = await galleryService.getGalleries(req.tenantId!, {
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: galleries,
    });
  })
);

/**
 * Get gallery by ID
 */
router.get(
  '/galleries/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const gallery = await galleryService.getGallery(req.params.id);

    if (!gallery || gallery.tenant_id !== req.tenantId) {
      res.status(404).json({
        success: false,
        message: 'Gallery not found',
      });
      return;
    }

    res.json({
      success: true,
      data: gallery,
    });
  })
);

/**
 * Create gallery
 */
router.post(
  '/galleries',
  authenticate,
  validateGallery,
  asyncHandler(async (req: Request, res: Response) => {
    const gallery = await galleryService.createGallery({
      ...req.body,
      tenant_id: req.tenantId!,
      created_by: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      data: gallery,
    });
  })
);

/**
 * Update gallery
 */
router.put(
  '/galleries/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const gallery = await galleryService.updateGallery(req.params.id, req.body);

    res.json({
      success: true,
      data: gallery,
    });
  })
);

/**
 * Delete gallery
 */
router.delete(
  '/galleries/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    await galleryService.deleteGallery(req.params.id);

    res.json({
      success: true,
      message: 'Gallery deleted successfully',
    });
  })
);

/**
 * Add content to gallery
 */
router.post(
  '/galleries/:id/content',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const { content_id, position, settings } = req.body;

    const galleryContent = await galleryService.addContentToGallery(
      req.params.id,
      content_id,
      position,
      settings
    );

    res.status(201).json({
      success: true,
      data: galleryContent,
    });
  })
);

/**
 * Remove content from gallery
 */
router.delete(
  '/galleries/:id/content/:contentId',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    await galleryService.removeContent(req.params.id, req.params.contentId);

    res.json({
      success: true,
      message: 'Content removed from gallery',
    });
  })
);

/**
 * Get gallery analytics
 */
router.get(
  '/galleries/:id/analytics',
  authenticate,
  validateUUID('id'),
  validateDateRange,
  asyncHandler(async (req: Request, res: Response) => {
    const { start_date, end_date } = req.query;

    const analytics = await galleryService.getGalleryAnalytics(
      req.params.id,
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      success: true,
      data: analytics,
    });
  })
);

/**
 * Publish gallery
 */
router.post(
  '/galleries/:id/publish',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const gallery = await galleryService.publishGallery(req.params.id);

    res.json({
      success: true,
      data: gallery,
    });
  })
);

// ==================== TAGGING ROUTES ====================

/**
 * Tag product on content
 */
router.post(
  '/content/:id/tags',
  authenticate,
  validateProductTag,
  asyncHandler(async (req: Request, res: Response) => {
    const tag = await taggingService.tagProduct({
      content_id: req.params.id,
      ...req.body,
      tenant_id: req.tenantId!,
      created_by: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      data: tag,
    });
  })
);

/**
 * Get tags for content
 */
router.get(
  '/content/:id/tags',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const tags = await taggingService.getTagsForContent(req.params.id);

    res.json({
      success: true,
      data: tags,
    });
  })
);

/**
 * Update tag
 */
router.put(
  '/tags/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const tag = await taggingService.updateTag(req.params.id, req.body);

    res.json({
      success: true,
      data: tag,
    });
  })
);

/**
 * Delete tag
 */
router.delete(
  '/tags/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    await taggingService.deleteTag(req.params.id);

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  })
);

/**
 * Auto-detect products in content
 */
router.post(
  '/content/:id/detect',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { content_url, content_type, min_confidence } = req.body;

    const tags = await taggingService.autoDetectProducts(
      req.params.id,
      content_url,
      content_type,
      req.tenantId!,
      min_confidence
    );

    res.json({
      success: true,
      data: tags,
    });
  })
);

// ==================== ATTRIBUTION ROUTES ====================

/**
 * Track attribution event
 */
router.post(
  '/events',
  optionalAuth,
  validateAttributionEvent,
  asyncHandler(async (req: Request, res: Response) => {
    const event = await attributionService.trackEvent({
      ...req.body,
      tenant_id: req.tenantId || req.body.tenant_id,
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  })
);

/**
 * Get attribution report
 */
router.get(
  '/attribution/report',
  authenticate,
  validateDateRange,
  asyncHandler(async (req: Request, res: Response) => {
    const { start_date, end_date, model_type } = req.query;

    const report = await attributionService.getAttributionReport(req.tenantId!, {
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      model_type: model_type as any,
    });

    res.json({
      success: true,
      data: report,
    });
  })
);

/**
 * Get content ROI
 */
router.get(
  '/attribution/content/:id/roi',
  authenticate,
  validateDateRange,
  asyncHandler(async (req: Request, res: Response) => {
    const { start_date, end_date } = req.query;

    const roi = await attributionService.getContentROI(
      req.params.id,
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      success: true,
      data: roi,
    });
  })
);

/**
 * Get creator ROI
 */
router.post(
  '/attribution/creator/roi',
  authenticate,
  validateDateRange,
  asyncHandler(async (req: Request, res: Response) => {
    const { creator_id, content_ids } = req.body;
    const { start_date, end_date } = req.query;

    const roi = await attributionService.getCreatorROI(
      creator_id,
      content_ids,
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      success: true,
      data: roi,
    });
  })
);

// ==================== CHECKOUT ROUTES ====================

/**
 * Initiate checkout
 */
router.post(
  '/checkout',
  optionalAuth,
  validateCheckout,
  asyncHandler(async (req: Request, res: Response) => {
    const session = await checkoutService.initiateCheckout({
      ...req.body,
      tenant_id: req.tenantId || req.body.tenant_id,
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  })
);

/**
 * Get checkout session
 */
router.get(
  '/checkout/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const session = await checkoutService.getCheckoutSession(req.params.token);

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Checkout session not found or expired',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  })
);

/**
 * Update checkout session
 */
router.put(
  '/checkout/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const session = await checkoutService.updateCheckoutSession(
      req.params.token,
      req.body
    );

    res.json({
      success: true,
      data: session,
    });
  })
);

/**
 * Process order
 */
router.post(
  '/checkout/process',
  validateProcessOrder,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await checkoutService.processOrder(req.body);

    res.status(201).json({
      success: true,
      data: order,
    });
  })
);

// ==================== ORDER ROUTES ====================

/**
 * Get orders
 */
router.get(
  '/orders',
  authenticate,
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50, offset = 0, status, customer_email, start_date, end_date } = req.query;

    const orders = await checkoutService.getOrders(req.tenantId!, {
      status: status as any,
      customer_email: customer_email as string,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: orders,
    });
  })
);

/**
 * Get order by ID
 */
router.get(
  '/orders/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await checkoutService.getOrderStatus(req.params.id);

    if (!order || order.tenant_id !== req.tenantId) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  })
);

/**
 * Get order by order number
 */
router.get(
  '/orders/number/:orderNumber',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await checkoutService.getOrderByNumber(req.params.orderNumber);

    if (!order || order.tenant_id !== req.tenantId) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  })
);

/**
 * Update order status
 */
router.put(
  '/orders/:id/status',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, metadata } = req.body;

    const order = await checkoutService.updateOrderStatus(
      req.params.id,
      status,
      metadata
    );

    res.json({
      success: true,
      data: order,
    });
  })
);

/**
 * Cancel order
 */
router.post(
  '/orders/:id/cancel',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;

    const order = await checkoutService.cancelOrder(req.params.id, reason);

    res.json({
      success: true,
      data: order,
    });
  })
);

export default router;
