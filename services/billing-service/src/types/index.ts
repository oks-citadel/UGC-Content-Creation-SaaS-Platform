import { Subscription, Plan, Invoice, Entitlement } from '.prisma/billing-service-client';

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

export interface SubscriptionWithEntitlements extends Subscription {
  plan: Plan;
  entitlements: Entitlement[];
}

export interface InvoiceWithSubscription extends Invoice {
  subscription: SubscriptionWithPlan;
}

export interface PlanLimits {
  VIEWS?: number | null;
  RENDERS?: number | null;
  AI_GENERATIONS?: number | null;
  WORKFLOW_RUNS?: number | null;
  STORAGE_GB?: number | null;
  BANDWIDTH_GB?: number | null;
  API_CALLS?: number | null;
}

export interface PlanFeatures {
  name: string;
  description: string;
  included: boolean;
}

export interface UsageSummary {
  type: string;
  used: number;
  limit: number | null;
  percentage: number;
}

export interface OverageItem {
  feature: string;
  overage: number;
  cost: number;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
}

export interface DunningConfig {
  maxRetries: number;
  retryIntervalHours: number;
  notificationSchedule: number[];
}

export interface PaymentMethodDetails {
  type: string;
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface CreateSubscriptionParams {
  userId: string;
  planName: string;
  email: string;
  name?: string;
  paymentMethodId?: string;
}

export interface UpdateSubscriptionParams {
  planName?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface RecordUsageParams {
  userId: string;
  subscriptionId: string;
  type: string;
  quantity: number;
  unit?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateInvoiceParams {
  subscriptionId: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
  lineItems?: any[];
  metadata?: Record<string, any>;
}
