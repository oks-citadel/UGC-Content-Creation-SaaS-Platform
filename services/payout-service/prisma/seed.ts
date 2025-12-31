// =============================================================================
// Payout Service - Database Seed Script
// =============================================================================
// Usage: npx prisma db seed
// =============================================================================

import { PrismaClient } from '.prisma/payout-client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Test IDs (should match other services)
const TEST_CREATOR_ID_1 = '550e8400-e29b-41d4-a716-446655440020';
const TEST_CREATOR_ID_2 = '550e8400-e29b-41d4-a716-446655440021';
const TEST_CAMPAIGN_ID_1 = '550e8400-e29b-41d4-a716-446655440030';
const TEST_CAMPAIGN_ID_2 = '550e8400-e29b-41d4-a716-446655440031';
const TEST_CONTENT_ID_1 = '550e8400-e29b-41d4-a716-446655440040';
const TEST_CONTENT_ID_2 = '550e8400-e29b-41d4-a716-446655440041';

async function main() {
  console.log('🌱 Seeding payout-service database...');

  // Create payout settings
  const settings = [
    {
      id: randomUUID(),
      key: 'minimum_payout_amount',
      value: { amount: 2500, currency: 'USD' }, // $25.00
      description: 'Minimum amount required to request a payout',
    },
    {
      id: randomUUID(),
      key: 'platform_fee_tiers',
      value: {
        new: 0.20,        // 20%
        rising: 0.15,     // 15%
        established: 0.12, // 12%
        elite: 0.10,      // 10%
      },
      description: 'Platform fee percentages by creator tier',
    },
    {
      id: randomUUID(),
      key: 'payout_processing_days',
      value: {
        stripe_connect: 2,
        paypal: 3,
        bank_transfer: 5,
      },
      description: 'Estimated processing days by payout method',
    },
    {
      id: randomUUID(),
      key: 'tax_threshold_1099',
      value: { amount: 60000, currency: 'USD' }, // $600.00
      description: '1099 reporting threshold for US creators',
    },
  ];

  for (const setting of settings) {
    await prisma.payoutSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`✅ ${settings.length} payout settings created`);

  // Create creator balances
  const balance1Id = randomUUID();
  const balance2Id = randomUUID();

  const balances = [
    {
      id: balance1Id,
      creatorId: TEST_CREATOR_ID_1,
      availableBalance: BigInt(125000), // $1,250.00
      pendingBalance: BigInt(50000),    // $500.00
      lifetimeEarnings: BigInt(850000), // $8,500.00
      lifetimePayouts: BigInt(675000),  // $6,750.00
      currency: 'USD',
      schedule: 'BI_WEEKLY' as const,
      minimumPayout: 2500, // $25.00
      holdPayouts: false,
      nextPayoutDate: new Date('2024-02-15'),
      lastPayoutDate: new Date('2024-02-01'),
      lastPayoutAmount: BigInt(100000), // $1,000.00
    },
    {
      id: balance2Id,
      creatorId: TEST_CREATOR_ID_2,
      availableBalance: BigInt(35000),  // $350.00
      pendingBalance: BigInt(15000),    // $150.00
      lifetimeEarnings: BigInt(120000), // $1,200.00
      lifetimePayouts: BigInt(70000),   // $700.00
      currency: 'USD',
      schedule: 'MONTHLY' as const,
      minimumPayout: 5000, // $50.00
      holdPayouts: false,
      nextPayoutDate: new Date('2024-03-01'),
      lastPayoutDate: new Date('2024-02-01'),
      lastPayoutAmount: BigInt(50000), // $500.00
    },
  ];

  for (const balance of balances) {
    await prisma.creatorBalance.upsert({
      where: { creatorId: balance.creatorId },
      update: {},
      create: balance,
    });
  }
  console.log(`✅ ${balances.length} creator balances created`);

  // Create payout accounts
  const account1Id = randomUUID();
  const account2Id = randomUUID();

  const accounts = [
    {
      id: account1Id,
      creatorId: TEST_CREATOR_ID_1,
      type: 'STRIPE_CONNECT' as const,
      status: 'VERIFIED' as const,
      isDefault: true,
      stripeAccountId: 'acct_1234567890',
      country: 'US',
      currency: 'USD',
      payoutsEnabled: true,
      verificationStatus: 'verified',
      connectedAt: new Date('2024-01-01'),
      verifiedAt: new Date('2024-01-02'),
    },
    {
      id: account2Id,
      creatorId: TEST_CREATOR_ID_2,
      type: 'PAYPAL' as const,
      status: 'VERIFIED' as const,
      isDefault: true,
      paypalEmail: 'creator2@email.com',
      country: 'US',
      currency: 'USD',
      payoutsEnabled: true,
      verificationStatus: 'verified',
      connectedAt: new Date('2024-01-15'),
      verifiedAt: new Date('2024-01-15'),
    },
  ];

  for (const account of accounts) {
    await prisma.payoutAccount.upsert({
      where: { id: account.id },
      update: {},
      create: account,
    });
  }
  console.log(`✅ ${accounts.length} payout accounts created`);

  // Create earnings
  const earnings = [
    {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_1,
      balanceId: balance1Id,
      type: 'CAMPAIGN_PAYMENT' as const,
      status: 'CLEARED' as const,
      contentId: TEST_CONTENT_ID_1,
      campaignId: TEST_CAMPAIGN_ID_1,
      campaignName: 'Summer Product Launch',
      brandName: 'Acme Corp',
      grossAmount: BigInt(50000),   // $500.00
      platformFee: BigInt(7500),    // $75.00 (15%)
      feePercentage: 15.00,
      netAmount: BigInt(42500),     // $425.00
      currency: 'USD',
      clearedAt: new Date('2024-01-15'),
    },
    {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_1,
      balanceId: balance1Id,
      type: 'CAMPAIGN_PAYMENT' as const,
      status: 'CLEARED' as const,
      contentId: TEST_CONTENT_ID_2,
      campaignId: TEST_CAMPAIGN_ID_1,
      campaignName: 'Summer Product Launch',
      brandName: 'Acme Corp',
      grossAmount: BigInt(75000),   // $750.00
      platformFee: BigInt(11250),   // $112.50 (15%)
      feePercentage: 15.00,
      netAmount: BigInt(63750),     // $637.50
      currency: 'USD',
      clearedAt: new Date('2024-01-20'),
    },
    {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_1,
      balanceId: balance1Id,
      type: 'BONUS' as const,
      status: 'CLEARED' as const,
      campaignId: TEST_CAMPAIGN_ID_1,
      campaignName: 'Summer Product Launch',
      brandName: 'Acme Corp',
      grossAmount: BigInt(10000),   // $100.00
      platformFee: BigInt(0),
      feePercentage: 0,
      netAmount: BigInt(10000),     // $100.00 (no fee on bonuses)
      currency: 'USD',
      description: 'Performance bonus for viral content',
      clearedAt: new Date('2024-01-25'),
    },
    {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_1,
      balanceId: balance1Id,
      type: 'CAMPAIGN_PAYMENT' as const,
      status: 'PENDING' as const,
      campaignId: TEST_CAMPAIGN_ID_2,
      campaignName: 'Winter Collection',
      brandName: 'Fashion Brand',
      grossAmount: BigInt(60000),   // $600.00
      platformFee: BigInt(9000),    // $90.00 (15%)
      feePercentage: 15.00,
      netAmount: BigInt(51000),     // $510.00
      currency: 'USD',
      description: 'Pending content approval',
    },
    {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_2,
      balanceId: balance2Id,
      type: 'CAMPAIGN_PAYMENT' as const,
      status: 'CLEARED' as const,
      campaignId: TEST_CAMPAIGN_ID_1,
      campaignName: 'Summer Product Launch',
      brandName: 'Acme Corp',
      grossAmount: BigInt(40000),   // $400.00
      platformFee: BigInt(8000),    // $80.00 (20% - new creator tier)
      feePercentage: 20.00,
      netAmount: BigInt(32000),     // $320.00
      currency: 'USD',
      clearedAt: new Date('2024-01-18'),
    },
  ];

  for (const earning of earnings) {
    await prisma.earning.create({
      data: earning,
    });
  }
  console.log(`✅ ${earnings.length} earnings created`);

  // Create payouts
  const payout1Id = randomUUID();
  const payouts = [
    {
      id: payout1Id,
      creatorId: TEST_CREATOR_ID_1,
      balanceId: balance1Id,
      accountId: account1Id,
      method: 'STRIPE_CONNECT' as const,
      status: 'COMPLETED' as const,
      amount: BigInt(100000),       // $1,000.00
      fee: BigInt(0),               // No fee for Stripe Connect
      netAmount: BigInt(100000),    // $1,000.00
      currency: 'USD',
      reference: 'PO-2024-001',
      stripeTransferId: 'tr_1234567890',
      stripePayoutId: 'po_1234567890',
      estimatedArrival: new Date('2024-02-03'),
      completedAt: new Date('2024-02-03'),
    },
    {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_2,
      balanceId: balance2Id,
      accountId: account2Id,
      method: 'PAYPAL' as const,
      status: 'COMPLETED' as const,
      amount: BigInt(50000),        // $500.00
      fee: BigInt(1500),            // $15.00 PayPal fee
      netAmount: BigInt(48500),     // $485.00
      currency: 'USD',
      reference: 'PO-2024-002',
      paypalBatchId: 'BATCH_123456',
      estimatedArrival: new Date('2024-02-05'),
      completedAt: new Date('2024-02-04'),
    },
  ];

  for (const payout of payouts) {
    await prisma.payout.create({
      data: payout,
    });
  }
  console.log(`✅ ${payouts.length} payouts created`);

  // Create payout events
  const payoutEvents = [
    {
      id: randomUUID(),
      payoutId: payout1Id,
      eventType: 'payout.created',
      previousStatus: null,
      newStatus: 'PENDING' as const,
      data: { initiatedBy: 'user' },
    },
    {
      id: randomUUID(),
      payoutId: payout1Id,
      eventType: 'payout.processing',
      previousStatus: 'PENDING' as const,
      newStatus: 'PROCESSING' as const,
      externalEventId: 'evt_stripe_123',
      data: { stripeTransferId: 'tr_1234567890' },
    },
    {
      id: randomUUID(),
      payoutId: payout1Id,
      eventType: 'payout.completed',
      previousStatus: 'PROCESSING' as const,
      newStatus: 'COMPLETED' as const,
      externalEventId: 'evt_stripe_456',
      data: { arrivalDate: '2024-02-03' },
    },
  ];

  for (const event of payoutEvents) {
    await prisma.payoutEvent.create({
      data: event,
    });
  }
  console.log(`✅ ${payoutEvents.length} payout events created`);

  // Create tax documents
  const taxDocuments = [
    {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_1,
      type: 'W9' as const,
      status: 'VERIFIED' as const,
      taxYear: 2024,
      taxIdLast4: '1234',
      legalName: 'Test Creator One',
      addressLine1: '123 Creator Street',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
      documentUrl: 'https://docs.creatorbridge.com/tax/w9_creator1.pdf',
      signedAt: new Date('2024-01-05'),
      signatureIp: '192.168.1.100',
      reviewedAt: new Date('2024-01-06'),
      expiresAt: new Date('2027-01-05'), // W-9 valid for 3 years
    },
  ];

  for (const doc of taxDocuments) {
    await prisma.taxDocument.create({
      data: doc,
    });
  }
  console.log(`✅ ${taxDocuments.length} tax documents created`);

  // Create 1099 form (for previous year if threshold met)
  await prisma.form1099.create({
    data: {
      id: randomUUID(),
      creatorId: TEST_CREATOR_ID_1,
      taxYear: 2023,
      totalEarnings: BigInt(250000), // $2,500.00
      status: 'generated',
      documentUrl: 'https://docs.creatorbridge.com/tax/1099_2023_creator1.pdf',
      generatedAt: new Date('2024-01-31'),
    },
  });
  console.log('✅ 1099 form created');

  // Create webhook event record
  await prisma.payoutWebhookEvent.create({
    data: {
      id: randomUUID(),
      provider: 'stripe',
      eventId: 'evt_stripe_test_123',
      eventType: 'payout.paid',
      payload: {
        id: 'po_1234567890',
        amount: 100000,
        status: 'paid',
      },
      processed: true,
      processedAt: new Date(),
    },
  });
  console.log('✅ Webhook event created');

  console.log('');
  console.log('🎉 Payout service seeding completed!');
  console.log('');
  console.log('Summary:');
  console.log(`  - Payout settings: ${settings.length}`);
  console.log(`  - Creator balances: ${balances.length}`);
  console.log(`  - Payout accounts: ${accounts.length}`);
  console.log(`  - Earnings: ${earnings.length}`);
  console.log(`  - Payouts: ${payouts.length}`);
  console.log(`  - Payout events: ${payoutEvents.length}`);
  console.log(`  - Tax documents: ${taxDocuments.length}`);
  console.log(`  - 1099 forms: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
