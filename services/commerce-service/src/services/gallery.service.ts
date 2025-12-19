import prisma from '../config/database';
import logger from '../config/logger';
import { ShoppableGallery, GalleryLayout } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface CreateGalleryData {
  name: string;
  description?: string;
  layout: GalleryLayout;
  settings?: any;
  theme?: any;
  cta_settings?: any;
  tenant_id: string;
  created_by: string;
}

interface UpdateGalleryData {
  name?: string;
  description?: string;
  layout?: GalleryLayout;
  settings?: any;
  theme?: any;
  cta_settings?: any;
  is_active?: boolean;
}

interface GalleryAnalytics {
  gallery_id: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  conversion_rate: number;
  average_order_value: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  top_content: Array<{
    content_id: string;
    views: number;
    clicks: number;
    conversions: number;
  }>;
}

export class GalleryService {
  /**
   * Create a new shoppable gallery
   */
  async createGallery(data: CreateGalleryData): Promise<ShoppableGallery> {
    try {
      const embedCode = this.generateEmbedCode(uuidv4());

      const gallery = await prisma.shoppableGallery.create({
        data: {
          ...data,
          embed_code: embedCode,
        },
      });

      logger.info(`Gallery created: ${gallery.id}`);
      return gallery;
    } catch (error) {
      logger.error('Failed to create gallery:', error);
      throw error;
    }
  }

  /**
   * Update an existing gallery
   */
  async updateGallery(galleryId: string, data: UpdateGalleryData): Promise<ShoppableGallery> {
    try {
      const gallery = await prisma.shoppableGallery.update({
        where: { id: galleryId },
        data,
      });

      logger.info(`Gallery updated: ${gallery.id}`);
      return gallery;
    } catch (error) {
      logger.error(`Failed to update gallery ${galleryId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a gallery
   */
  async deleteGallery(galleryId: string): Promise<void> {
    try {
      await prisma.shoppableGallery.delete({
        where: { id: galleryId },
      });

      logger.info(`Gallery deleted: ${galleryId}`);
    } catch (error) {
      logger.error(`Failed to delete gallery ${galleryId}:`, error);
      throw error;
    }
  }

  /**
   * Get gallery by ID
   */
  async getGallery(galleryId: string): Promise<ShoppableGallery | null> {
    try {
      return await prisma.shoppableGallery.findUnique({
        where: { id: galleryId },
        include: {
          content_items: {
            include: {
              product_tags: {
                include: {
                  product: true,
                },
              },
            },
          },
          products: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to get gallery ${galleryId}:`, error);
      throw error;
    }
  }

  /**
   * Get all galleries for a tenant
   */
  async getGalleries(tenantId: string, filters?: {
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ShoppableGallery[]> {
    try {
      return await prisma.shoppableGallery.findMany({
        where: {
          tenant_id: tenantId,
          ...(filters?.is_active !== undefined && { is_active: filters.is_active }),
        },
        include: {
          content_items: true,
          products: true,
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get galleries:', error);
      throw error;
    }
  }

  /**
   * Add content to gallery
   */
  async addContentToGallery(
    galleryId: string,
    contentId: string,
    position?: number,
    settings?: any
  ): Promise<any> {
    try {
      // Check if content already exists in gallery
      const existing = await prisma.galleryContent.findUnique({
        where: {
          gallery_id_content_id: {
            gallery_id: galleryId,
            content_id: contentId,
          },
        },
      });

      if (existing) {
        throw new Error('Content already exists in gallery');
      }

      // Get the next position if not provided
      let finalPosition = position;
      if (finalPosition === undefined) {
        const maxPosition = await prisma.galleryContent.findFirst({
          where: { gallery_id: galleryId },
          orderBy: { position: 'desc' },
        });
        finalPosition = maxPosition ? maxPosition.position + 1 : 0;
      }

      const galleryContent = await prisma.galleryContent.create({
        data: {
          gallery_id: galleryId,
          content_id: contentId,
          position: finalPosition,
          settings,
        },
      });

      logger.info(`Content ${contentId} added to gallery ${galleryId}`);
      return galleryContent;
    } catch (error) {
      logger.error('Failed to add content to gallery:', error);
      throw error;
    }
  }

  /**
   * Remove content from gallery
   */
  async removeContent(galleryId: string, contentId: string): Promise<void> {
    try {
      await prisma.galleryContent.delete({
        where: {
          gallery_id_content_id: {
            gallery_id: galleryId,
            content_id: contentId,
          },
        },
      });

      logger.info(`Content ${contentId} removed from gallery ${galleryId}`);
    } catch (error) {
      logger.error('Failed to remove content from gallery:', error);
      throw error;
    }
  }

  /**
   * Add product to gallery
   */
  async addProductToGallery(
    galleryId: string,
    productId: string,
    position?: number,
    is_featured: boolean = false
  ): Promise<any> {
    try {
      // Check if product already exists in gallery
      const existing = await prisma.galleryProduct.findUnique({
        where: {
          gallery_id_product_id: {
            gallery_id: galleryId,
            product_id: productId,
          },
        },
      });

      if (existing) {
        throw new Error('Product already exists in gallery');
      }

      // Get the next position if not provided
      let finalPosition = position;
      if (finalPosition === undefined) {
        const maxPosition = await prisma.galleryProduct.findFirst({
          where: { gallery_id: galleryId },
          orderBy: { position: 'desc' },
        });
        finalPosition = maxPosition ? maxPosition.position + 1 : 0;
      }

      const galleryProduct = await prisma.galleryProduct.create({
        data: {
          gallery_id: galleryId,
          product_id: productId,
          position: finalPosition,
          is_featured,
        },
      });

      logger.info(`Product ${productId} added to gallery ${galleryId}`);
      return galleryProduct;
    } catch (error) {
      logger.error('Failed to add product to gallery:', error);
      throw error;
    }
  }

  /**
   * Generate embed code for gallery
   */
  generateEmbedCode(galleryId: string, customDomain?: string): string {
    const domain = customDomain || 'https://nexus-ugc.com';
    const embedUrl = `${domain}/embed/gallery/${galleryId}`;

    return `<div id="nexus-gallery-${galleryId}"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${domain}/embed/sdk.js';
    script.async = true;
    script.onload = function() {
      NexusGallery.init({
        galleryId: '${galleryId}',
        containerId: 'nexus-gallery-${galleryId}',
        apiUrl: '${domain}/api'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
  }

  /**
   * Publish gallery
   */
  async publishGallery(galleryId: string): Promise<ShoppableGallery> {
    try {
      const gallery = await prisma.shoppableGallery.update({
        where: { id: galleryId },
        data: {
          is_active: true,
          published_at: new Date(),
        },
      });

      logger.info(`Gallery published: ${galleryId}`);
      return gallery;
    } catch (error) {
      logger.error(`Failed to publish gallery ${galleryId}:`, error);
      throw error;
    }
  }

  /**
   * Get gallery analytics
   */
  async getGalleryAnalytics(
    galleryId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GalleryAnalytics> {
    try {
      const gallery = await prisma.shoppableGallery.findUnique({
        where: { id: galleryId },
      });

      if (!gallery) {
        throw new Error('Gallery not found');
      }

      // Build date filter
      const dateFilter = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };

      // Get view events
      const views = await prisma.attributionEvent.count({
        where: {
          gallery_id: galleryId,
          type: 'view',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      // Get click events
      const clicks = await prisma.attributionEvent.count({
        where: {
          gallery_id: galleryId,
          type: 'click',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      // Get purchase events
      const purchases = await prisma.attributionEvent.findMany({
        where: {
          gallery_id: galleryId,
          type: 'purchase',
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      const conversions = purchases.length;
      const revenue = purchases.reduce(
        (sum, event) => sum + (event.revenue ? parseFloat(event.revenue.toString()) : 0),
        0
      );

      // Get top products
      const productStats = await prisma.attributionEvent.groupBy({
        by: ['product_id'],
        where: {
          gallery_id: galleryId,
          product_id: { not: null },
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
        _count: { id: true },
        _sum: { revenue: true },
      });

      const topProducts = await Promise.all(
        productStats.slice(0, 10).map(async (stat) => {
          const product = await prisma.product.findUnique({
            where: { id: stat.product_id! },
          });

          const productClicks = await prisma.attributionEvent.count({
            where: {
              gallery_id: galleryId,
              product_id: stat.product_id,
              type: 'click',
            },
          });

          const productPurchases = await prisma.attributionEvent.count({
            where: {
              gallery_id: galleryId,
              product_id: stat.product_id,
              type: 'purchase',
            },
          });

          return {
            product_id: stat.product_id!,
            product_name: product?.name || 'Unknown',
            clicks: productClicks,
            conversions: productPurchases,
            revenue: parseFloat(stat._sum.revenue?.toString() || '0'),
          };
        })
      );

      // Get top content
      const contentStats = await prisma.attributionEvent.groupBy({
        by: ['content_id'],
        where: {
          gallery_id: galleryId,
          content_id: { not: null },
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
        _count: { id: true },
      });

      const topContent = await Promise.all(
        contentStats.slice(0, 10).map(async (stat) => {
          const contentViews = await prisma.attributionEvent.count({
            where: {
              gallery_id: galleryId,
              content_id: stat.content_id,
              type: 'view',
            },
          });

          const contentClicks = await prisma.attributionEvent.count({
            where: {
              gallery_id: galleryId,
              content_id: stat.content_id,
              type: 'click',
            },
          });

          const contentPurchases = await prisma.attributionEvent.count({
            where: {
              gallery_id: galleryId,
              content_id: stat.content_id,
              type: 'purchase',
            },
          });

          return {
            content_id: stat.content_id!,
            views: contentViews,
            clicks: contentClicks,
            conversions: contentPurchases,
          };
        })
      );

      return {
        gallery_id: galleryId,
        views,
        clicks,
        conversions,
        revenue,
        conversion_rate: views > 0 ? (conversions / views) * 100 : 0,
        average_order_value: conversions > 0 ? revenue / conversions : 0,
        top_products: topProducts.sort((a, b) => b.revenue - a.revenue),
        top_content: topContent.sort((a, b) => b.conversions - a.conversions),
      };
    } catch (error) {
      logger.error(`Failed to get analytics for gallery ${galleryId}:`, error);
      throw error;
    }
  }
}

export default new GalleryService();
