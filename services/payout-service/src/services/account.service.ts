import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

export interface BankAccount {
  accountHolderName: string;
  accountNumberLast4: string;
  routingNumber?: string;
  bankName: string;
  bankAddress?: string;
  swiftCode?: string;
}

export interface PayoutAccount {
  id: string;
  creatorId: string;
  type: 'stripe_connect' | 'paypal' | 'bank_transfer';
  status: 'pending' | 'active' | 'suspended' | 'requires_action';
  country: string;
  defaultCurrency: string;
  stripeConnectAccountId?: string;
  paypalEmail?: string;
  bankAccount?: BankAccount;
  autoPayoutEnabled: boolean;
  autoPayoutThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface SetupAccountParams {
  type: 'stripe_connect' | 'paypal' | 'bank_transfer';
  country: string;
  currency: string;
  bankAccount?: {
    accountHolderName: string;
    accountNumber: string;
    routingNumber?: string;
    bankName: string;
    bankAddress?: string;
    swiftCode?: string;
  };
  paypalEmail?: string;
}

export interface StripeConnectStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
}

export class AccountService {
  private stripe: Stripe | null = null;
  private accounts: Map<string, PayoutAccount> = new Map();

  constructor() {
    if (config.stripeSecretKey) {
      this.stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  async getAccount(creatorId: string): Promise<PayoutAccount | null> {
    return this.accounts.get(creatorId) || null;
  }

  async setupAccount(creatorId: string, params: SetupAccountParams): Promise<PayoutAccount> {
    // Check for existing account
    const existing = this.accounts.get(creatorId);
    if (existing) {
      throw new AppError('Account already exists', 400, 'ACCOUNT_EXISTS');
    }

    const account: PayoutAccount = {
      id: uuidv4(),
      creatorId,
      type: params.type,
      status: 'pending',
      country: params.country,
      defaultCurrency: params.currency,
      autoPayoutEnabled: false,
      autoPayoutThreshold: config.minimumPayoutAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (params.type === 'paypal' && params.paypalEmail) {
      account.paypalEmail = params.paypalEmail;
      account.status = 'active';
    }

    if (params.type === 'bank_transfer' && params.bankAccount) {
      account.bankAccount = {
        accountHolderName: params.bankAccount.accountHolderName,
        accountNumberLast4: params.bankAccount.accountNumber.slice(-4),
        routingNumber: params.bankAccount.routingNumber,
        bankName: params.bankAccount.bankName,
        bankAddress: params.bankAccount.bankAddress,
        swiftCode: params.bankAccount.swiftCode,
      };
      account.status = 'pending'; // Requires verification
    }

    this.accounts.set(creatorId, account);
    logger.info({ accountId: account.id, creatorId, type: params.type }, 'Payout account created');

    return account;
  }

  async updateAccount(
    creatorId: string,
    updates: { defaultCurrency?: string; autoPayoutEnabled?: boolean; autoPayoutThreshold?: number }
  ): Promise<PayoutAccount> {
    const account = this.accounts.get(creatorId);

    if (!account) {
      throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    if (updates.defaultCurrency) {
      if (!config.supportedCurrencies.includes(updates.defaultCurrency)) {
        throw new AppError('Unsupported currency', 400, 'UNSUPPORTED_CURRENCY');
      }
      account.defaultCurrency = updates.defaultCurrency;
    }

    if (updates.autoPayoutEnabled !== undefined) {
      account.autoPayoutEnabled = updates.autoPayoutEnabled;
    }

    if (updates.autoPayoutThreshold !== undefined) {
      if (updates.autoPayoutThreshold < config.minimumPayoutAmount) {
        throw new AppError(
          `Threshold must be at least ${config.minimumPayoutAmount}`,
          400,
          'THRESHOLD_TOO_LOW'
        );
      }
      account.autoPayoutThreshold = updates.autoPayoutThreshold;
    }

    account.updatedAt = new Date().toISOString();
    this.accounts.set(creatorId, account);

    logger.info({ accountId: account.id, creatorId }, 'Payout account updated');
    return account;
  }

  async initiateStripeConnect(
    creatorId: string,
    returnUrl: string,
    refreshUrl: string
  ): Promise<string> {
    if (!this.stripe) {
      throw new AppError('Stripe not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    let account = this.accounts.get(creatorId);

    // Create Stripe Connect account if not exists
    if (!account || !account.stripeConnectAccountId) {
      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        capabilities: {
          transfers: { requested: true },
        },
      });

      if (!account) {
        account = {
          id: uuidv4(),
          creatorId,
          type: 'stripe_connect',
          status: 'pending',
          country: 'US', // Will be updated during onboarding
          defaultCurrency: 'USD',
          stripeConnectAccountId: stripeAccount.id,
          autoPayoutEnabled: false,
          autoPayoutThreshold: config.minimumPayoutAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        account.type = 'stripe_connect';
        account.stripeConnectAccountId = stripeAccount.id;
        account.status = 'pending';
        account.updatedAt = new Date().toISOString();
      }

      this.accounts.set(creatorId, account);
    }

    // Create account link for onboarding
    const accountLink = await this.stripe.accountLinks.create({
      account: account.stripeConnectAccountId!,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  async getStripeConnectStatus(creatorId: string): Promise<StripeConnectStatus | null> {
    const account = this.accounts.get(creatorId);

    if (!account || !account.stripeConnectAccountId) {
      return null;
    }

    if (!this.stripe) {
      throw new AppError('Stripe not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const stripeAccount = await this.stripe.accounts.retrieve(account.stripeConnectAccountId);

    // Update account status based on Stripe account status
    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      account.status = 'active';
    } else if (stripeAccount.requirements?.currently_due?.length) {
      account.status = 'requires_action';
    }
    account.updatedAt = new Date().toISOString();
    this.accounts.set(creatorId, account);

    return {
      accountId: stripeAccount.id,
      chargesEnabled: stripeAccount.charges_enabled ?? false,
      payoutsEnabled: stripeAccount.payouts_enabled ?? false,
      detailsSubmitted: stripeAccount.details_submitted ?? false,
      requirements: {
        currentlyDue: stripeAccount.requirements?.currently_due || [],
        eventuallyDue: stripeAccount.requirements?.eventually_due || [],
        pastDue: stripeAccount.requirements?.past_due || [],
      },
    };
  }

  async removeAccount(creatorId: string): Promise<void> {
    const account = this.accounts.get(creatorId);

    if (!account) {
      throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    // Note: In production, we would NOT delete Stripe Connect accounts
    // as there may be regulatory requirements to keep records

    this.accounts.delete(creatorId);
    logger.info({ creatorId }, 'Payout account removed');
  }
}
