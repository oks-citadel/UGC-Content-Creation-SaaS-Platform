import Stripe from 'stripe';
import config from '../config';
import logger from '../utils/logger';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export class StripeIntegration {
  // Customer Management
  async createCustomer(params: {
    userId: string;
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          userId: params.userId,
          ...params.metadata,
        },
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        userId: params.userId,
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error, params });
      throw error;
    }
  }

  async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.update(customerId, params);

      logger.info('Stripe customer updated', { customerId });

      return customer;
    } catch (error) {
      logger.error('Failed to update Stripe customer', { error, customerId });
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      logger.error('Failed to retrieve Stripe customer', { error, customerId });
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
    paymentMethodId?: string;
  }): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (params.trialPeriodDays) {
        subscriptionParams.trial_period_days = params.trialPeriodDays;
      }

      if (params.paymentMethodId) {
        subscriptionParams.default_payment_method = params.paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      logger.info('Stripe subscription created', {
        subscriptionId: subscription.id,
        customerId: params.customerId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create Stripe subscription', { error, params });
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(
        subscriptionId,
        params
      );

      logger.info('Stripe subscription updated', { subscriptionId });

      return subscription;
    } catch (error) {
      logger.error('Failed to update Stripe subscription', {
        error,
        subscriptionId,
      });
      throw error;
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = false
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      if (!cancelAtPeriodEnd) {
        await stripe.subscriptions.cancel(subscriptionId);
      }

      logger.info('Stripe subscription canceled', {
        subscriptionId,
        cancelAtPeriodEnd,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel Stripe subscription', {
        error,
        subscriptionId,
      });
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve Stripe subscription', {
        error,
        subscriptionId,
      });
      throw error;
    }
  }

  // Payment Intent Management
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId: string;
    metadata?: Record<string, string>;
    paymentMethodId?: string;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        metadata: params.metadata,
        payment_method: params.paymentMethodId,
        confirm: !!params.paymentMethodId,
      });

      logger.info('Payment intent created', { paymentIntentId: paymentIntent.id });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent', { error, params });
      throw error;
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId
      );

      logger.info('Payment intent confirmed', { paymentIntentId });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to confirm payment intent', {
        error,
        paymentIntentId,
      });
      throw error;
    }
  }

  // Invoice Management
  async createInvoice(params: {
    customerId: string;
    subscriptionId?: string;
    metadata?: Record<string, string>;
    dueDate?: number;
  }): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.create({
        customer: params.customerId,
        subscription: params.subscriptionId,
        metadata: params.metadata,
        due_date: params.dueDate,
        auto_advance: true,
      });

      logger.info('Stripe invoice created', { invoiceId: invoice.id });

      return invoice;
    } catch (error) {
      logger.error('Failed to create Stripe invoice', { error, params });
      throw error;
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.finalizeInvoice(invoiceId);

      logger.info('Stripe invoice finalized', { invoiceId });

      return invoice;
    } catch (error) {
      logger.error('Failed to finalize Stripe invoice', { error, invoiceId });
      throw error;
    }
  }

  async getInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data;
    } catch (error) {
      logger.error('Failed to retrieve Stripe invoices', { error, customerId });
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      logger.error('Failed to retrieve Stripe invoice', { error, invoiceId });
      throw error;
    }
  }

  async payInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.pay(invoiceId);

      logger.info('Stripe invoice paid', { invoiceId });

      return invoice;
    } catch (error) {
      logger.error('Failed to pay Stripe invoice', { error, invoiceId });
      throw error;
    }
  }

  // Payment Method Management
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        }
      );

      logger.info('Payment method attached', {
        paymentMethodId,
        customerId,
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Failed to attach payment method', {
        error,
        paymentMethodId,
        customerId,
      });
      throw error;
    }
  }

  async detachPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

      logger.info('Payment method detached', { paymentMethodId });

      return paymentMethod;
    } catch (error) {
      logger.error('Failed to detach payment method', {
        error,
        paymentMethodId,
      });
      throw error;
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      logger.info('Default payment method set', {
        customerId,
        paymentMethodId,
      });

      return customer;
    } catch (error) {
      logger.error('Failed to set default payment method', {
        error,
        customerId,
        paymentMethodId,
      });
      throw error;
    }
  }

  async listPaymentMethods(
    customerId: string,
    type: string = 'card'
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: type as any,
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to list payment methods', { error, customerId });
      throw error;
    }
  }

  // Webhook Handling
  constructEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return event;
    } catch (error) {
      logger.error('Failed to construct webhook event', { error });
      throw error;
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.info('Processing Stripe webhook', { eventType: event.type });

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'customer.subscription.trial_will_end':
          // These are handled by the webhook controller
          break;

        case 'invoice.created':
        case 'invoice.finalized':
        case 'invoice.paid':
        case 'invoice.payment_failed':
          // These are handled by the webhook controller
          break;

        case 'payment_intent.succeeded':
        case 'payment_intent.payment_failed':
          // These are handled by the webhook controller
          break;

        default:
          logger.info('Unhandled webhook event type', { eventType: event.type });
      }
    } catch (error) {
      logger.error('Error processing webhook', { error, eventType: event.type });
      throw error;
    }
  }

  // Price and Product Management
  async createPrice(params: {
    productId: string;
    unitAmount: number;
    currency: string;
    recurring?: {
      interval: 'month' | 'year';
      intervalCount?: number;
    };
  }): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.create({
        product: params.productId,
        unit_amount: params.unitAmount,
        currency: params.currency,
        recurring: params.recurring,
      });

      logger.info('Stripe price created', { priceId: price.id });

      return price;
    } catch (error) {
      logger.error('Failed to create Stripe price', { error, params });
      throw error;
    }
  }

  async createProduct(params: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Product> {
    try {
      const product = await stripe.products.create({
        name: params.name,
        description: params.description,
        metadata: params.metadata,
      });

      logger.info('Stripe product created', { productId: product.id });

      return product;
    } catch (error) {
      logger.error('Failed to create Stripe product', { error, params });
      throw error;
    }
  }
}

export default new StripeIntegration();
