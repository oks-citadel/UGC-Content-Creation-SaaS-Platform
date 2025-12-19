// =============================================================================
// Stripe Mock Implementation
// =============================================================================

import { vi } from 'vitest';

export const mockStripe = {
  customers: {
    create: vi.fn().mockResolvedValue({
      id: 'cus_mock123',
      email: 'test@example.com',
      created: Date.now() / 1000,
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'cus_mock123',
      email: 'test@example.com',
    }),
    update: vi.fn().mockResolvedValue({
      id: 'cus_mock123',
      email: 'updated@example.com',
    }),
    del: vi.fn().mockResolvedValue({
      id: 'cus_mock123',
      deleted: true,
    }),
  },
  paymentIntents: {
    create: vi.fn().mockResolvedValue({
      id: 'pi_mock123',
      amount: 5000,
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: 'pi_mock123_secret_mock',
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'pi_mock123',
      status: 'succeeded',
    }),
    confirm: vi.fn().mockResolvedValue({
      id: 'pi_mock123',
      status: 'succeeded',
    }),
    cancel: vi.fn().mockResolvedValue({
      id: 'pi_mock123',
      status: 'canceled',
    }),
  },
  paymentMethods: {
    create: vi.fn().mockResolvedValue({
      id: 'pm_mock123',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
      },
    }),
    attach: vi.fn().mockResolvedValue({
      id: 'pm_mock123',
      customer: 'cus_mock123',
    }),
    detach: vi.fn().mockResolvedValue({
      id: 'pm_mock123',
    }),
  },
  subscriptions: {
    create: vi.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'active',
      current_period_start: Date.now() / 1000,
      current_period_end: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'active',
    }),
    update: vi.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'active',
    }),
    cancel: vi.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'canceled',
    }),
  },
  prices: {
    create: vi.fn().mockResolvedValue({
      id: 'price_mock123',
      unit_amount: 2999,
      currency: 'usd',
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'price_mock123',
      unit_amount: 2999,
    }),
  },
  invoices: {
    create: vi.fn().mockResolvedValue({
      id: 'in_mock123',
      amount_due: 2999,
      status: 'draft',
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'in_mock123',
      status: 'paid',
    }),
    pay: vi.fn().mockResolvedValue({
      id: 'in_mock123',
      status: 'paid',
    }),
  },
  webhooks: {
    constructEvent: vi.fn().mockImplementation((payload, signature, secret) => {
      return {
        id: 'evt_mock123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_mock123',
            status: 'succeeded',
          },
        },
      };
    }),
  },
};

// Factory function to create Stripe mock
export function createStripeMock() {
  return mockStripe;
}

// Reset all mocks
export function resetStripeMocks() {
  Object.values(mockStripe).forEach((service) => {
    if (typeof service === 'object') {
      Object.values(service).forEach((method) => {
        if (typeof method === 'function' && 'mockClear' in method) {
          method.mockClear();
        }
      });
    }
  });
}

export default mockStripe;
