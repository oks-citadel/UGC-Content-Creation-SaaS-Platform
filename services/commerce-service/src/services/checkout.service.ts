import prisma from '../config/database';
import logger from '../config/logger';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';
import { Order, CheckoutSession, OrderStatus, Prisma } from '.prisma/commerce-service-client';
import attributionService from './attribution.service';

interface CheckoutItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  price?: number;
}

interface CustomerData {
  [key: string]: Prisma.InputJsonValue | undefined;
  email: string;
  name?: string;
  phone?: string;
  shipping_address?: Prisma.InputJsonValue;
  billing_address?: Prisma.InputJsonValue;
}

interface InitiateCheckoutData {
  items: CheckoutItem[];
  customer_data?: Partial<CustomerData>;
  content_id?: string;
  gallery_id?: string;
  session_id?: string;
  tenant_id: string;
}

interface ProcessOrderData {
  session_token: string;
  customer_data: CustomerData;
  payment_method?: string;
  shipping_method?: string;
  notes?: string;
}

export class CheckoutService {
  /**
   * Initiate checkout session
   */
  async initiateCheckout(data: InitiateCheckoutData): Promise<CheckoutSession> {
    try {
      // Validate and calculate totals
      const { items, subtotal, total } = await this.calculateTotals(data.items);

      // Create checkout session
      const sessionToken = uuidv4();
      const expiresAt = new Date(
        Date.now() + config.checkout.sessionTimeoutMinutes * 60 * 1000
      );

      const session = await prisma.checkoutSession.create({
        data: {
          session_token: sessionToken,
          items: items,
          subtotal,
          total,
          currency: 'USD',
          customer_email: data.customer_data?.email,
          customer_data: data.customer_data,
          content_id: data.content_id,
          gallery_id: data.gallery_id,
          tenant_id: data.tenant_id,
          expires_at: expiresAt,
        },
      });

      // Track checkout initiation
      if (data.session_id) {
        await attributionService.trackEvent({
          type: 'add_to_cart',
          content_id: data.content_id,
          gallery_id: data.gallery_id,
          session_id: data.session_id,
          tenant_id: data.tenant_id,
        });
      }

      logger.info(`Checkout session initiated: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Failed to initiate checkout:', error);
      throw error;
    }
  }

  /**
   * Calculate checkout totals
   */
  private async calculateTotals(items: CheckoutItem[]): Promise<{
    items: any[];
    subtotal: number;
    total: number;
  }> {
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
      });

      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const price = item.price || parseFloat(product.price.toString());
      const itemTotal = price * item.quantity;

      enrichedItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price,
        total: itemTotal,
        product_name: product.name,
        product_sku: product.sku,
      });

      subtotal += itemTotal;
    }

    // For now, total = subtotal (tax and shipping calculated later)
    const total = subtotal;

    return {
      items: enrichedItems,
      subtotal,
      total,
    };
  }

  /**
   * Get checkout session
   */
  async getCheckoutSession(sessionToken: string): Promise<CheckoutSession | null> {
    try {
      const session = await prisma.checkoutSession.findUnique({
        where: { session_token: sessionToken },
      });

      // Check if session is expired
      if (session && session.expires_at < new Date()) {
        logger.warn(`Checkout session expired: ${session.id}`);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to get checkout session:', error);
      throw error;
    }
  }

  /**
   * Update checkout session
   */
  async updateCheckoutSession(
    sessionToken: string,
    data: {
      items?: CheckoutItem[];
      customer_data?: any;
    }
  ): Promise<CheckoutSession> {
    try {
      const session = await this.getCheckoutSession(sessionToken);

      if (!session) {
        throw new Error('Checkout session not found or expired');
      }

      const updateData: any = {};

      if (data.items) {
        const { items, subtotal, total } = await this.calculateTotals(data.items);
        updateData.items = items;
        updateData.subtotal = subtotal;
        updateData.total = total;
      }

      if (data.customer_data) {
        updateData.customer_data = data.customer_data;
        updateData.customer_email = data.customer_data.email;
      }

      const updated = await prisma.checkoutSession.update({
        where: { session_token: sessionToken },
        data: updateData,
      });

      logger.info(`Checkout session updated: ${updated.id}`);
      return updated;
    } catch (error) {
      logger.error('Failed to update checkout session:', error);
      throw error;
    }
  }

  /**
   * Process order from checkout session
   */
  async processOrder(data: ProcessOrderData): Promise<Order> {
    try {
      const session = await this.getCheckoutSession(data.session_token);

      if (!session) {
        throw new Error('Checkout session not found or expired');
      }

      if (session.is_completed) {
        throw new Error('Checkout session already completed');
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const order = await prisma.order.create({
        data: {
          order_number: orderNumber,
          customer_email: data.customer_data.email,
          customer_name: data.customer_data.name,
          customer_phone: data.customer_data.phone,
          customer_data: data.customer_data,
          subtotal: session.subtotal,
          tax: 0, // Calculate tax if needed
          shipping: 0, // Calculate shipping if needed
          discount: 0,
          total: session.total,
          currency: session.currency,
          status: 'pending',
          payment_status: 'pending',
          source_content_id: session.content_id || undefined,
          source_gallery_id: session.gallery_id || undefined,
          shipping_address: data.customer_data.shipping_address,
          billing_address: data.customer_data.billing_address,
          notes: data.notes,
          tenant_id: session.tenant_id,
        },
      });

      // Create order items
      const items = session.items as any[];
      for (const item of items) {
        await prisma.orderItem.create({
          data: {
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            product_name: item.product_name,
            product_sku: item.product_sku,
            variant_info: item.variant_id ? { variant_id: item.variant_id } : undefined,
          },
        });
      }

      // Mark session as completed
      await prisma.checkoutSession.update({
        where: { id: session.id },
        data: {
          is_completed: true,
          order_id: order.id,
          completed_at: new Date(),
        },
      });

      // Track purchase event
      await attributionService.trackEvent({
        type: 'purchase',
        content_id: session.content_id || undefined,
        gallery_id: session.gallery_id || undefined,
        order_id: order.id,
        revenue: parseFloat(order.total.toString()),
        tenant_id: session.tenant_id,
      });

      logger.info(`Order processed: ${order.order_number}`);
      return order;
    } catch (error) {
      logger.error('Failed to process order:', error);
      throw error;
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NX-${timestamp}-${random}`;
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<Order | null> {
    try {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to get order status ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      return await prisma.order.findUnique({
        where: { order_number: orderNumber },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to get order ${orderNumber}:`, error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: any
  ): Promise<Order> {
    try {
      const updateData: any = { status };

      if (status === 'completed' && metadata?.completed_at !== false) {
        updateData.completed_at = new Date();
      }

      if (metadata?.payment_status) {
        updateData.payment_status = metadata.payment_status;
      }

      if (metadata?.fulfillment_status) {
        updateData.fulfillment_status = metadata.fulfillment_status;
      }

      if (metadata?.tracking_number) {
        updateData.tracking_number = metadata.tracking_number;
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });

      logger.info(`Order ${orderId} status updated to ${status}`);
      return order;
    } catch (error) {
      logger.error(`Failed to update order status ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        },
      });

      logger.info(`Order cancelled: ${orderId}`);
      return order;
    } catch (error) {
      logger.error(`Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get orders for tenant
   */
  async getOrders(
    tenantId: string,
    filters?: {
      status?: OrderStatus;
      customer_email?: string;
      start_date?: Date;
      end_date?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<Order[]> {
    try {
      return await prisma.order.findMany({
        where: {
          tenant_id: tenantId,
          ...(filters?.status && { status: filters.status }),
          ...(filters?.customer_email && { customer_email: filters.customer_email }),
          ...(filters?.start_date && {
            created_at: {
              gte: filters.start_date,
              ...(filters?.end_date && { lte: filters.end_date }),
            },
          }),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get orders:', error);
      throw error;
    }
  }

  /**
   * Clean up expired checkout sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.checkoutSession.deleteMany({
        where: {
          expires_at: { lt: new Date() },
          is_completed: false,
        },
      });

      logger.info(`Cleaned up ${result.count} expired checkout sessions`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
      throw error;
    }
  }
}

export default new CheckoutService();
