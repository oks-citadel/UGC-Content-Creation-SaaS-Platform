import Stripe from 'stripe';
import config from '../config';
import logger from '../utils/logger';
import { AppError } from '../middleware/error-handler';

class StripeConnectIntegration {
  private stripe: Stripe;

  constructor() {
    if (!config.stripe.secretKey) {
      logger.warn('Stripe secret key not configured');
    }

    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16' as any,
      typescript: true,
    });
  }

  /**
   * Create a connected account for a creator
   */
  async createConnectedAccount(creatorData: {
    email: string;
    country: string;
    creatorId: string;
  }): Promise<Stripe.Account> {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email: creatorData.email,
        country: creatorData.country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          creatorId: creatorData.creatorId,
        },
      });

      logger.info(`Stripe connected account created: ${account.id} for creator ${creatorData.creatorId}`);
      return account;
    } catch (error) {
      logger.error('Error creating Stripe connected account:', error);
      throw new AppError(500, 'Failed to create payment account');
    }
  }

  /**
   * Create an account link for onboarding
   */
  async createAccountLink(creatorId: string, accountId?: string): Promise<Stripe.AccountLink> {
    try {
      if (!accountId) {
        // Create account first if not provided
        const account = await this.createConnectedAccount({
          email: `creator-${creatorId}@temp.nexus.com`,
          country: 'US',
          creatorId,
        });
        accountId = account.id;
      }

      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL}/settings/payouts/refresh`,
        return_url: `${process.env.FRONTEND_URL}/settings/payouts/success`,
        type: 'account_onboarding',
      });

      logger.info(`Account link created for account: ${accountId}`);
      return accountLink;
    } catch (error) {
      logger.error('Error creating account link:', error);
      throw new AppError(500, 'Failed to create onboarding link');
    }
  }

  /**
   * Get account details
   */
  async getAccount(accountId: string): Promise<Stripe.Account> {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error) {
      logger.error('Error retrieving account:', error);
      throw new AppError(500, 'Failed to retrieve account details');
    }
  }

  /**
   * Create a payout to a connected account
   */
  async createPayout(payoutData: {
    accountId: string;
    amount: number;
    currency: string;
    metadata?: any;
  }): Promise<Stripe.Payout> {
    try {
      const payout = await this.stripe.payouts.create(
        {
          amount: payoutData.amount,
          currency: payoutData.currency,
          metadata: payoutData.metadata || {},
        },
        {
          stripeAccount: payoutData.accountId,
        }
      );

      logger.info(`Payout created: ${payout.id} to account ${payoutData.accountId}`);
      return payout;
    } catch (error) {
      logger.error('Error creating payout:', error);
      throw new AppError(500, 'Failed to process payout');
    }
  }

  /**
   * Create a transfer to a connected account
   */
  async createTransfer(transferData: {
    accountId: string;
    amount: number;
    currency: string;
    description?: string;
    metadata?: any;
  }): Promise<Stripe.Transfer> {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: transferData.amount,
        currency: transferData.currency,
        destination: transferData.accountId,
        description: transferData.description,
        metadata: transferData.metadata || {},
      });

      logger.info(`Transfer created: ${transfer.id} to account ${transferData.accountId}`);
      return transfer;
    } catch (error) {
      logger.error('Error creating transfer:', error);
      throw new AppError(500, 'Failed to create transfer');
    }
  }

  /**
   * Get payout details
   */
  async getPayout(payoutId: string, accountId: string): Promise<Stripe.Payout> {
    try {
      return await this.stripe.payouts.retrieve(
        payoutId,
        { stripeAccount: accountId }
      );
    } catch (error) {
      logger.error('Error retrieving payout:', error);
      throw new AppError(500, 'Failed to retrieve payout details');
    }
  }

  /**
   * List payouts for an account
   */
  async listPayouts(accountId: string, limit: number = 10): Promise<Stripe.ApiList<Stripe.Payout>> {
    try {
      return await this.stripe.payouts.list(
        { limit },
        { stripeAccount: accountId }
      );
    } catch (error) {
      logger.error('Error listing payouts:', error);
      throw new AppError(500, 'Failed to list payouts');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      logger.info(`Stripe webhook received: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;
        case 'payout.paid':
          await this.handlePayoutPaid(event.data.object as Stripe.Payout);
          break;
        case 'payout.failed':
          await this.handlePayoutFailed(event.data.object as Stripe.Payout);
          break;
        case 'transfer.created':
          await this.handleTransferCreated(event.data.object as Stripe.Transfer);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      return event;
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw new AppError(400, 'Invalid webhook signature');
    }
  }

  /**
   * Get account balance
   */
  async getBalance(accountId: string): Promise<Stripe.Balance> {
    try {
      return await this.stripe.balance.retrieve({
        stripeAccount: accountId,
      });
    } catch (error) {
      logger.error('Error retrieving balance:', error);
      throw new AppError(500, 'Failed to retrieve balance');
    }
  }

  // Private webhook handlers

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    logger.info(`Account updated: ${account.id}, charges_enabled: ${account.charges_enabled}`);
    // Update database with account status
  }

  private async handlePayoutPaid(payout: Stripe.Payout): Promise<void> {
    logger.info(`Payout paid: ${payout.id}`);
    // Update payout status in database
  }

  private async handlePayoutFailed(payout: Stripe.Payout): Promise<void> {
    logger.error(`Payout failed: ${payout.id}`, { failure_message: payout.failure_message });
    // Update payout status in database and notify creator
  }

  private async handleTransferCreated(transfer: Stripe.Transfer): Promise<void> {
    logger.info(`Transfer created: ${transfer.id}`);
    // Track transfer in database
  }

  /**
   * Check if account is fully onboarded
   */
  async isAccountOnboarded(accountId: string): Promise<boolean> {
    try {
      const account = await this.getAccount(accountId);
      return account.charges_enabled && account.payouts_enabled;
    } catch (error) {
      logger.error('Error checking account onboarding status:', error);
      return false;
    }
  }

  /**
   * Delete connected account
   */
  async deleteAccount(accountId: string): Promise<Stripe.DeletedAccount> {
    try {
      const deleted = await this.stripe.accounts.del(accountId);
      logger.info(`Account deleted: ${accountId}`);
      return deleted;
    } catch (error) {
      logger.error('Error deleting account:', error);
      throw new AppError(500, 'Failed to delete account');
    }
  }
}

export default new StripeConnectIntegration();
