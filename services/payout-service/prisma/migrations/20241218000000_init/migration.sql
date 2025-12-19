-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('STRIPE_CONNECT', 'PAYPAL', 'BANK_TRANSFER', 'CHECK');

-- CreateEnum
CREATE TYPE "PayoutSchedule" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'MANUAL');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'CLEARED', 'PAID', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EarningType" AS ENUM ('CAMPAIGN_PAYMENT', 'BONUS', 'ROYALTY', 'REFERRAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TaxDocumentType" AS ENUM ('W9', 'W8BEN', 'W8BEN_E', 'FORM_1099');

-- CreateEnum
CREATE TYPE "TaxDocumentStatus" AS ENUM ('PENDING_SUBMISSION', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PayoutAccountStatus" AS ENUM ('PENDING_SETUP', 'PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED', 'CLOSED');

-- CreateTable
CREATE TABLE "creator_balances" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "available_balance" BIGINT NOT NULL DEFAULT 0,
    "pending_balance" BIGINT NOT NULL DEFAULT 0,
    "lifetime_earnings" BIGINT NOT NULL DEFAULT 0,
    "lifetime_payouts" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "schedule" "PayoutSchedule" NOT NULL DEFAULT 'BI_WEEKLY',
    "minimum_payout" INTEGER NOT NULL DEFAULT 2500,
    "hold_payouts" BOOLEAN NOT NULL DEFAULT false,
    "next_payout_date" TIMESTAMP(3),
    "last_payout_date" TIMESTAMP(3),
    "last_payout_amount" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "balance_id" UUID NOT NULL,
    "type" "EarningType" NOT NULL DEFAULT 'CAMPAIGN_PAYMENT',
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "content_id" UUID,
    "campaign_id" UUID,
    "campaign_name" TEXT,
    "brand_name" TEXT,
    "gross_amount" BIGINT NOT NULL,
    "platform_fee" BIGINT NOT NULL DEFAULT 0,
    "fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "net_amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "reference" TEXT,
    "cleared_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "payout_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "balance_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "method" "PayoutMethod" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "amount" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL DEFAULT 0,
    "net_amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reference" TEXT,
    "external_id" TEXT,
    "stripe_transfer_id" TEXT,
    "stripe_payout_id" TEXT,
    "paypal_batch_id" TEXT,
    "failure_code" TEXT,
    "failure_message" TEXT,
    "estimated_arrival" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_events" (
    "id" UUID NOT NULL,
    "payout_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "previous_status" "PayoutStatus",
    "new_status" "PayoutStatus",
    "external_event_id" TEXT,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_accounts" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "type" "PayoutMethod" NOT NULL,
    "status" "PayoutAccountStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "stripe_account_id" TEXT,
    "paypal_email" TEXT,
    "bank_account_last4" TEXT,
    "bank_name" TEXT,
    "bank_routing_last4" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" TEXT,
    "verification_errors" TEXT[],
    "metadata" JSONB,
    "connected_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_documents" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "type" "TaxDocumentType" NOT NULL,
    "status" "TaxDocumentStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "tax_year" INTEGER,
    "tax_id_last4" TEXT,
    "legal_name" TEXT,
    "business_name" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "document_url" TEXT,
    "signed_at" TIMESTAMP(3),
    "signature_ip" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms_1099" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "total_earnings" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "document_url" TEXT,
    "generated_at" TIMESTAMP(3),
    "filed_at" TIMESTAMP(3),
    "correction_of" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_1099_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_balances_creator_id_key" ON "creator_balances"("creator_id");

-- CreateIndex
CREATE INDEX "earnings_creator_id_idx" ON "earnings"("creator_id");

-- CreateIndex
CREATE INDEX "earnings_balance_id_idx" ON "earnings"("balance_id");

-- CreateIndex
CREATE INDEX "earnings_campaign_id_idx" ON "earnings"("campaign_id");

-- CreateIndex
CREATE INDEX "earnings_status_idx" ON "earnings"("status");

-- CreateIndex
CREATE INDEX "earnings_created_at_idx" ON "earnings"("created_at");

-- CreateIndex
CREATE INDEX "earnings_payout_id_idx" ON "earnings"("payout_id");

-- CreateIndex
CREATE INDEX "payouts_creator_id_idx" ON "payouts"("creator_id");

-- CreateIndex
CREATE INDEX "payouts_balance_id_idx" ON "payouts"("balance_id");

-- CreateIndex
CREATE INDEX "payouts_account_id_idx" ON "payouts"("account_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "payouts_created_at_idx" ON "payouts"("created_at");

-- CreateIndex
CREATE INDEX "payouts_stripe_transfer_id_idx" ON "payouts"("stripe_transfer_id");

-- CreateIndex
CREATE INDEX "payout_events_payout_id_idx" ON "payout_events"("payout_id");

-- CreateIndex
CREATE INDEX "payout_events_event_type_idx" ON "payout_events"("event_type");

-- CreateIndex
CREATE INDEX "payout_accounts_creator_id_idx" ON "payout_accounts"("creator_id");

-- CreateIndex
CREATE INDEX "payout_accounts_type_idx" ON "payout_accounts"("type");

-- CreateIndex
CREATE INDEX "payout_accounts_status_idx" ON "payout_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payout_accounts_stripe_account_id_key" ON "payout_accounts"("stripe_account_id");

-- CreateIndex
CREATE INDEX "tax_documents_creator_id_idx" ON "tax_documents"("creator_id");

-- CreateIndex
CREATE INDEX "tax_documents_type_idx" ON "tax_documents"("type");

-- CreateIndex
CREATE INDEX "tax_documents_status_idx" ON "tax_documents"("status");

-- CreateIndex
CREATE INDEX "tax_documents_tax_year_idx" ON "tax_documents"("tax_year");

-- CreateIndex
CREATE INDEX "forms_1099_creator_id_idx" ON "forms_1099"("creator_id");

-- CreateIndex
CREATE INDEX "forms_1099_tax_year_idx" ON "forms_1099"("tax_year");

-- CreateIndex
CREATE UNIQUE INDEX "forms_1099_creator_id_tax_year_key" ON "forms_1099"("creator_id", "tax_year");

-- CreateIndex
CREATE UNIQUE INDEX "payout_webhook_events_event_id_key" ON "payout_webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "payout_webhook_events_provider_idx" ON "payout_webhook_events"("provider");

-- CreateIndex
CREATE INDEX "payout_webhook_events_processed_idx" ON "payout_webhook_events"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "payout_settings_key_key" ON "payout_settings"("key");

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_balance_id_fkey" FOREIGN KEY ("balance_id") REFERENCES "creator_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_balance_id_fkey" FOREIGN KEY ("balance_id") REFERENCES "creator_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "payout_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_events" ADD CONSTRAINT "payout_events_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
