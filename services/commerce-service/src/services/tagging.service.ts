import prisma from '../config/database';
import logger from '../config/logger';
import axios from 'axios';
import config from '../config';
import { ProductTag } from '@prisma/client';

interface CreateTagData {
  content_id: string;
  product_id: string;
  gallery_content_id?: string;
  position_x?: number;
  position_y?: number;
  timestamp?: number;
  label?: string;
  tenant_id: string;
  created_by?: string;
}

interface AutoDetectResult {
  product_id: string;
  confidence: number;
  position_x?: number;
  position_y?: number;
  timestamp?: number;
  label?: string;
}

export class TaggingService {
  /**
   * Tag a product on image or video
   */
  async tagProduct(data: CreateTagData): Promise<ProductTag> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: data.product_id },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Validate position data
      if (data.position_x !== undefined) {
        if (data.position_x < 0 || data.position_x > 1) {
          throw new Error('position_x must be between 0 and 1');
        }
      }

      if (data.position_y !== undefined) {
        if (data.position_y < 0 || data.position_y > 1) {
          throw new Error('position_y must be between 0 and 1');
        }
      }

      const tag = await prisma.productTag.create({
        data: {
          ...data,
          auto_detected: false,
        },
        include: {
          product: true,
        },
      });

      logger.info(`Product tag created: ${tag.id} for content ${data.content_id}`);
      return tag;
    } catch (error) {
      logger.error('Failed to create product tag:', error);
      throw error;
    }
  }

  /**
   * Update product tag
   */
  async updateTag(
    tagId: string,
    data: {
      position_x?: number;
      position_y?: number;
      timestamp?: number;
      label?: string;
      is_visible?: boolean;
    }
  ): Promise<ProductTag> {
    try {
      const tag = await prisma.productTag.update({
        where: { id: tagId },
        data,
        include: {
          product: true,
        },
      });

      logger.info(`Product tag updated: ${tagId}`);
      return tag;
    } catch (error) {
      logger.error(`Failed to update tag ${tagId}:`, error);
      throw error;
    }
  }

  /**
   * Delete product tag
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      await prisma.productTag.delete({
        where: { id: tagId },
      });

      logger.info(`Product tag deleted: ${tagId}`);
    } catch (error) {
      logger.error(`Failed to delete tag ${tagId}:`, error);
      throw error;
    }
  }

  /**
   * Get tags for content
   */
  async getTagsForContent(contentId: string): Promise<ProductTag[]> {
    try {
      return await prisma.productTag.findMany({
        where: {
          content_id: contentId,
          is_visible: true,
        },
        include: {
          product: true,
        },
        orderBy: { created_at: 'asc' },
      });
    } catch (error) {
      logger.error(`Failed to get tags for content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Get all tags for a tenant
   */
  async getTags(tenantId: string, filters?: {
    content_id?: string;
    product_id?: string;
    auto_detected?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProductTag[]> {
    try {
      return await prisma.productTag.findMany({
        where: {
          tenant_id: tenantId,
          ...(filters?.content_id && { content_id: filters.content_id }),
          ...(filters?.product_id && { product_id: filters.product_id }),
          ...(filters?.auto_detected !== undefined && { auto_detected: filters.auto_detected }),
        },
        include: {
          product: true,
        },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get tags:', error);
      throw error;
    }
  }

  /**
   * Auto-detect products in content using AI
   */
  async autoDetectProducts(
    contentId: string,
    contentUrl: string,
    contentType: 'image' | 'video',
    tenantId: string,
    minConfidence: number = 0.7
  ): Promise<ProductTag[]> {
    try {
      if (!config.features.enableAutoProductDetection) {
        throw new Error('Auto product detection is disabled');
      }

      logger.info(`Starting auto-detection for content ${contentId}`);

      // Call AI service for product detection
      const detectionResults = await this.callAIDetection(
        contentUrl,
        contentType,
        tenantId
      );

      // Filter results by confidence threshold
      const validResults = detectionResults.filter(
        (result) => result.confidence >= minConfidence
      );

      // Create tags for detected products
      const createdTags: ProductTag[] = [];
      for (const result of validResults) {
        try {
          const tag = await prisma.productTag.create({
            data: {
              content_id: contentId,
              product_id: result.product_id,
              position_x: result.position_x,
              position_y: result.position_y,
              timestamp: result.timestamp,
              label: result.label,
              auto_detected: true,
              confidence: result.confidence,
              tenant_id: tenantId,
            },
            include: {
              product: true,
            },
          });

          createdTags.push(tag);
        } catch (error) {
          logger.warn(`Failed to create tag for product ${result.product_id}:`, error);
        }
      }

      logger.info(`Auto-detected ${createdTags.length} products in content ${contentId}`);
      return createdTags;
    } catch (error) {
      logger.error('Auto-detection failed:', error);
      throw error;
    }
  }

  /**
   * Call AI service for product detection
   */
  private async callAIDetection(
    contentUrl: string,
    contentType: 'image' | 'video',
    tenantId: string
  ): Promise<AutoDetectResult[]> {
    try {
      // Get tenant's products for matching
      const products = await prisma.product.findMany({
        where: { tenant_id: tenantId },
        select: {
          id: true,
          name: true,
          description: true,
          images: true,
        },
      });

      // Call AI service
      const response = await axios.post(
        `${config.services.aiService.url}/detect/products`,
        {
          content_url: contentUrl,
          content_type: contentType,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            images: p.images,
          })),
        },
        {
          headers: {
            'Authorization': `Bearer ${config.services.aiService.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds
        }
      );

      return response.data.detections || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('AI service error:', error.response?.data || error.message);
      }
      throw new Error('Failed to call AI detection service');
    }
  }

  /**
   * Bulk tag products
   */
  async bulkTagProducts(tags: CreateTagData[]): Promise<ProductTag[]> {
    try {
      const createdTags: ProductTag[] = [];

      for (const tagData of tags) {
        try {
          const tag = await this.tagProduct(tagData);
          createdTags.push(tag);
        } catch (error) {
          logger.warn(`Failed to create tag for product ${tagData.product_id}:`, error);
        }
      }

      logger.info(`Bulk created ${createdTags.length} tags`);
      return createdTags;
    } catch (error) {
      logger.error('Bulk tag creation failed:', error);
      throw error;
    }
  }

  /**
   * Get tag statistics
   */
  async getTagStatistics(tenantId: string): Promise<{
    total_tags: number;
    auto_detected: number;
    manual: number;
    by_content: Array<{ content_id: string; count: number }>;
    by_product: Array<{ product_id: string; product_name: string; count: number }>;
  }> {
    try {
      const totalTags = await prisma.productTag.count({
        where: { tenant_id: tenantId },
      });

      const autoDetected = await prisma.productTag.count({
        where: {
          tenant_id: tenantId,
          auto_detected: true,
        },
      });

      const byContent = await prisma.productTag.groupBy({
        by: ['content_id'],
        where: { tenant_id: tenantId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const byProduct = await prisma.productTag.groupBy({
        by: ['product_id'],
        where: { tenant_id: tenantId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      // Enrich product data
      const enrichedProducts = await Promise.all(
        byProduct.map(async (stat) => {
          const product = await prisma.product.findUnique({
            where: { id: stat.product_id },
          });

          return {
            product_id: stat.product_id,
            product_name: product?.name || 'Unknown',
            count: stat._count.id,
          };
        })
      );

      return {
        total_tags: totalTags,
        auto_detected: autoDetected,
        manual: totalTags - autoDetected,
        by_content: byContent.map((stat) => ({
          content_id: stat.content_id,
          count: stat._count.id,
        })),
        by_product: enrichedProducts,
      };
    } catch (error) {
      logger.error('Failed to get tag statistics:', error);
      throw error;
    }
  }

  /**
   * Validate tag position
   */
  private validatePosition(x?: number, y?: number): boolean {
    if (x !== undefined && (x < 0 || x > 1)) {
      return false;
    }
    if (y !== undefined && (y < 0 || y > 1)) {
      return false;
    }
    return true;
  }
}

export default new TaggingService();
