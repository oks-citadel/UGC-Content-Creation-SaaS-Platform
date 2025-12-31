import Shopify from 'shopify-api-node';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';
import { Product, Order } from '.prisma/commerce-service-client';

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  variants: any[];
  images: any[];
  vendor?: string;
  product_type?: string;
  tags?: string;
  handle?: string;
}

interface ShopifyOrder {
  id: number;
  email: string;
  total_price: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: any[];
  customer?: any;
  shipping_address?: any;
  billing_address?: any;
}

interface ShopifyConfig {
  shopName: string;
  apiKey: string;
  password: string;
  apiVersion: string;
}

export class ShopifyIntegration {
  private client: Shopify | null = null;
  private tenantId: string;
  private shopName: string = '';

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Initialize Shopify client with credentials
   */
  async initialize(shopifyConfig: ShopifyConfig): Promise<void> {
    try {
      this.shopName = shopifyConfig.shopName;
      this.client = new Shopify({
        shopName: shopifyConfig.shopName,
        apiKey: shopifyConfig.apiKey,
        password: shopifyConfig.password,
        apiVersion: shopifyConfig.apiVersion || config.shopify.apiVersion,
      });

      logger.info(`Shopify client initialized for tenant ${this.tenantId}`);
    } catch (error) {
      logger.error('Failed to initialize Shopify client:', error);
      throw new Error('Shopify initialization failed');
    }
  }

  /**
   * Sync products from Shopify to database
   */
  async syncProducts(limit: number = 250): Promise<Product[]> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      logger.info(`Starting product sync for tenant ${this.tenantId}`);
      const syncedProducts: Product[] = [];
      let params: any = { limit };

      do {
        const products: ShopifyProduct[] = await this.client.product.list(params);

        for (const shopifyProduct of products) {
          const product = await this.syncSingleProduct(shopifyProduct);
          syncedProducts.push(product);
        }

        // Check if there are more products to fetch
        if (products.length < limit) {
          break;
        }

        // Update params for pagination
        params = {
          limit,
          since_id: products[products.length - 1].id,
        };
      } while (true);

      logger.info(`Synced ${syncedProducts.length} products from Shopify`);
      return syncedProducts;
    } catch (error) {
      logger.error('Product sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync a single product from Shopify
   */
  private async syncSingleProduct(shopifyProduct: ShopifyProduct): Promise<Product> {
    const images = shopifyProduct.images.map((img: any) => img.src);
    const variants = shopifyProduct.variants.map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity,
    }));

    const primaryVariant = shopifyProduct.variants[0];
    const tags = shopifyProduct.tags?.split(',').map(t => t.trim()) || [];

    return await prisma.product.upsert({
      where: {
        external_id: String(shopifyProduct.id),
      },
      update: {
        name: shopifyProduct.title,
        description: shopifyProduct.body_html,
        price: parseFloat(primaryVariant.price),
        images,
        variants,
        inventory: primaryVariant.inventory_quantity,
        tags,
        synced_at: new Date(),
      },
      create: {
        external_id: String(shopifyProduct.id),
        name: shopifyProduct.title,
        description: shopifyProduct.body_html,
        price: parseFloat(primaryVariant.price),
        images,
        variants,
        inventory: primaryVariant.inventory_quantity,
        source: 'shopify',
        source_url: `https://${this.shopName}.myshopify.com/products/${shopifyProduct.handle}`,
        tags,
        tenant_id: this.tenantId,
        synced_at: new Date(),
      },
    });
  }

  /**
   * Get a single product from Shopify
   */
  async getProduct(productId: string): Promise<Product | null> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      const shopifyProduct = await this.client.product.get(parseInt(productId));
      return await this.syncSingleProduct(shopifyProduct as ShopifyProduct);
    } catch (error) {
      logger.error(`Failed to get product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Search products in Shopify
   */
  async searchProducts(query: string, limit: number = 50): Promise<Product[]> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      const products: ShopifyProduct[] = await this.client.product.list({
        title: query,
        limit,
      });

      const syncedProducts: Product[] = [];
      for (const product of products) {
        const synced = await this.syncSingleProduct(product);
        syncedProducts.push(synced);
      }

      return syncedProducts;
    } catch (error) {
      logger.error('Product search failed:', error);
      throw error;
    }
  }

  /**
   * Create an order in Shopify
   */
  async createOrder(orderData: {
    email: string;
    line_items: Array<{ variant_id: number; quantity: number }>;
    shipping_address?: any;
    billing_address?: any;
  }): Promise<any> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      const order = await this.client.order.create({
        email: orderData.email,
        line_items: orderData.line_items,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
        financial_status: 'pending',
      });

      logger.info(`Order created in Shopify: ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Failed to create order in Shopify:', error);
      throw error;
    }
  }

  /**
   * Get orders from Shopify
   */
  async getOrders(params: { limit?: number; since_id?: number } = {}): Promise<any[]> {
    if (!this.client) {
      throw new Error('Shopify client not initialized');
    }

    try {
      const orders = await this.client.order.list({
        limit: params.limit || 50,
        since_id: params.since_id,
      });

      return orders;
    } catch (error) {
      logger.error('Failed to get orders from Shopify:', error);
      throw error;
    }
  }

  /**
   * Handle Shopify webhook events
   */
  async webhookHandler(topic: string, payload: any): Promise<void> {
    logger.info(`Received Shopify webhook: ${topic}`);

    try {
      switch (topic) {
        case 'products/create':
        case 'products/update':
          await this.syncSingleProduct(payload);
          break;

        case 'products/delete':
          await prisma.product.delete({
            where: { external_id: String(payload.id) },
          });
          break;

        case 'orders/create':
        case 'orders/updated':
          await this.syncOrder(payload);
          break;

        case 'orders/fulfilled':
          await this.updateOrderFulfillment(payload);
          break;

        default:
          logger.warn(`Unhandled webhook topic: ${topic}`);
      }
    } catch (error) {
      logger.error(`Webhook handler error for ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Sync order from webhook
   */
  private async syncOrder(shopifyOrder: ShopifyOrder): Promise<void> {
    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: { external_order_id: String(shopifyOrder.id) },
    });

    if (existingOrder) {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: this.mapOrderStatus(shopifyOrder.financial_status),
          payment_status: shopifyOrder.financial_status,
          fulfillment_status: shopifyOrder.fulfillment_status,
        },
      });
    }
  }

  /**
   * Update order fulfillment status
   */
  private async updateOrderFulfillment(shopifyOrder: ShopifyOrder): Promise<void> {
    await prisma.order.updateMany({
      where: { external_order_id: String(shopifyOrder.id) },
      data: {
        fulfillment_status: shopifyOrder.fulfillment_status,
        status: 'completed',
        completed_at: new Date(),
      },
    });
  }

  /**
   * Map Shopify order status to internal status
   */
  private mapOrderStatus(financialStatus: string): 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed' {
    const statusMap: Record<string, any> = {
      pending: 'pending',
      authorized: 'processing',
      partially_paid: 'processing',
      paid: 'completed',
      partially_refunded: 'refunded',
      refunded: 'refunded',
      voided: 'cancelled',
    };

    return statusMap[financialStatus] || 'pending';
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhook(data: string, hmacHeader: string, secret: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data, 'utf8')
      .digest('base64');

    return hash === hmacHeader;
  }
}

export default ShopifyIntegration;
