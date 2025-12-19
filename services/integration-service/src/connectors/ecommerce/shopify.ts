import axios from 'axios';
import { config } from '../../config';
import pino from 'pino';

const logger = pino({ name: 'shopify-connector' });

export class ShopifyConnector {
  async getAuthorizationUrl(shop: string, state: string, redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.shopify.apiKey,
      scope: 'read_products,write_products,read_orders,read_customers',
      redirect_uri: redirectUri,
      state,
    });

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(shop: string, code: string) {
    try {
      const response = await axios.post(
        `https://${shop}/admin/oauth/access_token`,
        {
          client_id: config.shopify.apiKey,
          client_secret: config.shopify.apiSecret,
          code,
        }
      );

      return {
        accessToken: response.data.access_token,
        scope: response.data.scope,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to exchange code for tokens');
      throw new Error('Failed to authenticate with Shopify');
    }
  }

  async getProducts(shop: string, accessToken: string) {
    try {
      const response = await axios.get(
        `https://${shop}/admin/api/2024-01/products.json`,
        {
          headers: { 'X-Shopify-Access-Token': accessToken },
        }
      );

      return response.data.products;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get products');
      throw new Error('Failed to get Shopify products');
    }
  }

  async createProduct(shop: string, accessToken: string, product: any) {
    try {
      const response = await axios.post(
        `https://${shop}/admin/api/2024-01/products.json`,
        { product },
        {
          headers: { 'X-Shopify-Access-Token': accessToken },
        }
      );

      return { id: response.data.product.id };
    } catch (error: any) {
      logger.error({ error }, 'Failed to create product');
      throw new Error('Failed to create Shopify product');
    }
  }

  async getOrders(shop: string, accessToken: string, status?: string) {
    try {
      const params: any = {};
      if (status) params.status = status;

      const response = await axios.get(
        `https://${shop}/admin/api/2024-01/orders.json`,
        {
          headers: { 'X-Shopify-Access-Token': accessToken },
          params,
        }
      );

      return response.data.orders;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get orders');
      throw new Error('Failed to get Shopify orders');
    }
  }

  async getCustomers(shop: string, accessToken: string) {
    try {
      const response = await axios.get(
        `https://${shop}/admin/api/2024-01/customers.json`,
        {
          headers: { 'X-Shopify-Access-Token': accessToken },
        }
      );

      return response.data.customers;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get customers');
      throw new Error('Failed to get Shopify customers');
    }
  }
}

export const shopifyConnector = new ShopifyConnector();
