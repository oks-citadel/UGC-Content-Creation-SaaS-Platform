import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';
import { Product, Order } from '@prisma/client';

interface WooProduct {
  id: number;
  name: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{ src: string }>;
  variations: number[];
  sku: string;
  stock_quantity: number;
  categories: Array<{ name: string }>;
  tags: Array<{ name: string }>;
  permalink: string;
}

interface WooOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  line_items: any[];
  billing: any;
  shipping: any;
  customer_id: number;
  payment_method: string;
  payment_method_title: string;
}

interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export class WooCommerceIntegration {
  private client: WooCommerceRestApi | null = null;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Initialize WooCommerce client with credentials
   */
  async initialize(wooConfig: WooCommerceConfig): Promise<void> {
    try {
      this.client = new WooCommerceRestApi({
        url: wooConfig.url,
        consumerKey: wooConfig.consumerKey,
        consumerSecret: wooConfig.consumerSecret,
        version: 'wc/v3',
        queryStringAuth: true,
      });

      logger.info(`WooCommerce client initialized for tenant ${this.tenantId}`);
    } catch (error) {
      logger.error('Failed to initialize WooCommerce client:', error);
      throw new Error('WooCommerce initialization failed');
    }
  }

  /**
   * Sync products from WooCommerce to database
   */
  async syncProducts(perPage: number = 100): Promise<Product[]> {
    if (!this.client) {
      throw new Error('WooCommerce client not initialized');
    }

    try {
      logger.info(`Starting product sync for tenant ${this.tenantId}`);
      const syncedProducts: Product[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.client.get('products', {
          per_page: perPage,
          page,
        });

        const products: WooProduct[] = response.data;

        for (const wooProduct of products) {
          const product = await this.syncSingleProduct(wooProduct);
          syncedProducts.push(product);
        }

        // Check if there are more pages
        const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
        hasMore = page < totalPages;
        page++;
      }

      logger.info(`Synced ${syncedProducts.length} products from WooCommerce`);
      return syncedProducts;
    } catch (error) {
      logger.error('Product sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync a single product from WooCommerce
   */
  private async syncSingleProduct(wooProduct: WooProduct): Promise<Product> {
    const images = wooProduct.images.map((img) => img.src);
    const tags = wooProduct.tags?.map(t => t.name) || [];
    const price = parseFloat(wooProduct.price || wooProduct.regular_price);
    const comparePrice = wooProduct.sale_price
      ? parseFloat(wooProduct.regular_price)
      : null;

    const variants = wooProduct.variations?.length > 0
      ? await this.getProductVariants(wooProduct.id)
      : null;

    return await prisma.product.upsert({
      where: {
        external_id: String(wooProduct.id),
      },
      update: {
        name: wooProduct.name,
        description: wooProduct.description || wooProduct.short_description,
        price,
        compare_price: comparePrice,
        sku: wooProduct.sku,
        images,
        variants,
        inventory: wooProduct.stock_quantity,
        tags,
        synced_at: new Date(),
      },
      create: {
        external_id: String(wooProduct.id),
        name: wooProduct.name,
        description: wooProduct.description || wooProduct.short_description,
        price,
        compare_price: comparePrice,
        sku: wooProduct.sku,
        images,
        variants,
        inventory: wooProduct.stock_quantity,
        source: 'woocommerce',
        source_url: wooProduct.permalink,
        tags,
        tenant_id: this.tenantId,
        synced_at: new Date(),
      },
    });
  }

  /**
   * Get product variants from WooCommerce
   */
  private async getProductVariants(productId: number): Promise<any> {
    if (!this.client) {
      return null;
    }

    try {
      const response = await this.client.get(`products/${productId}/variations`);
      return response.data.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        price: v.price,
        regular_price: v.regular_price,
        sale_price: v.sale_price,
        stock_quantity: v.stock_quantity,
        attributes: v.attributes,
      }));
    } catch (error) {
      logger.error(`Failed to get variants for product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Get a single product from WooCommerce
   */
  async getProduct(productId: string): Promise<Product | null> {
    if (!this.client) {
      throw new Error('WooCommerce client not initialized');
    }

    try {
      const response = await this.client.get(`products/${productId}`);
      return await this.syncSingleProduct(response.data);
    } catch (error) {
      logger.error(`Failed to get product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Search products in WooCommerce
   */
  async searchProducts(query: string, limit: number = 50): Promise<Product[]> {
    if (!this.client) {
      throw new Error('WooCommerce client not initialized');
    }

    try {
      const response = await this.client.get('products', {
        search: query,
        per_page: limit,
      });

      const products: WooProduct[] = response.data;
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
   * Create an order in WooCommerce
   */
  async createOrder(orderData: {
    customer_email: string;
    line_items: Array<{ product_id: number; quantity: number }>;
    billing?: any;
    shipping?: any;
  }): Promise<any> {
    if (!this.client) {
      throw new Error('WooCommerce client not initialized');
    }

    try {
      const response = await this.client.post('orders', {
        billing: orderData.billing || { email: orderData.customer_email },
        shipping: orderData.shipping,
        line_items: orderData.line_items,
        status: 'pending',
      });

      logger.info(`Order created in WooCommerce: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to create order in WooCommerce:', error);
      throw error;
    }
  }

  /**
   * Get orders from WooCommerce
   */
  async getOrders(params: { per_page?: number; page?: number; status?: string } = {}): Promise<any[]> {
    if (!this.client) {
      throw new Error('WooCommerce client not initialized');
    }

    try {
      const response = await this.client.get('orders', {
        per_page: params.per_page || 50,
        page: params.page || 1,
        status: params.status,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get orders from WooCommerce:', error);
      throw error;
    }
  }

  /**
   * Update order status in WooCommerce
   */
  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    if (!this.client) {
      throw new Error('WooCommerce client not initialized');
    }

    try {
      const response = await this.client.put(`orders/${orderId}`, {
        status,
      });

      logger.info(`Order ${orderId} status updated to ${status}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle WooCommerce webhook events
   */
  async webhookHandler(topic: string, payload: any): Promise<void> {
    logger.info(`Received WooCommerce webhook: ${topic}`);

    try {
      switch (topic) {
        case 'product.created':
        case 'product.updated':
          await this.syncSingleProduct(payload);
          break;

        case 'product.deleted':
          await prisma.product.delete({
            where: { external_id: String(payload.id) },
          });
          break;

        case 'order.created':
        case 'order.updated':
          await this.syncOrder(payload);
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
  private async syncOrder(wooOrder: WooOrder): Promise<void> {
    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: { external_order_id: String(wooOrder.id) },
    });

    if (existingOrder) {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: this.mapOrderStatus(wooOrder.status),
          payment_status: wooOrder.payment_method_title,
        },
      });
    }
  }

  /**
   * Map WooCommerce order status to internal status
   */
  private mapOrderStatus(status: string): 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed' {
    const statusMap: Record<string, any> = {
      pending: 'pending',
      processing: 'processing',
      'on-hold': 'pending',
      completed: 'completed',
      cancelled: 'cancelled',
      refunded: 'refunded',
      failed: 'failed',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    return hash === signature;
  }
}

export default WooCommerceIntegration;
