-- CreateEnum
CREATE TYPE "RightsType" AS ENUM ('EXCLUSIVE', 'NON_EXCLUSIVE', 'LIMITED');

-- CreateEnum
CREATE TYPE "RightsStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('ORGANIC_SOCIAL', 'PAID_SOCIAL', 'WEBSITE', 'EMAIL', 'DISPLAY_ADS', 'TV', 'OOH', 'PRINT');

-- CreateEnum
CREATE TYPE "LicenseTemplateType" AS ENUM ('STANDARD_EXCLUSIVE', 'STANDARD_NON_EXCLUSIVE', 'LIMITED_SOCIAL', 'PAID_ADVERTISING', 'FULL_BUYOUT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('ELECTRONIC', 'TYPED', 'UPLOADED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "content_rights" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "campaign_id" UUID,
    "type" "RightsType" NOT NULL,
    "status" "RightsStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_perpetual" BOOLEAN NOT NULL DEFAULT false,
    "territories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usage_types" "UsageType"[],
    "max_impressions" BIGINT,
    "no_editing" BOOLEAN NOT NULL DEFAULT false,
    "no_derivatives" BOOLEAN NOT NULL DEFAULT false,
    "attribution_required" BOOLEAN NOT NULL DEFAULT false,
    "custom_restrictions" TEXT,
    "compensation_type" TEXT,
    "compensation_amount" DECIMAL(12,2),
    "compensation_currency" TEXT DEFAULT 'USD',
    "royalty_percentage" DECIMAL(5,2),
    "template_id" UUID,
    "license_document_url" TEXT,
    "signed_document_url" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_rights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rights_signatures" (
    "id" UUID NOT NULL,
    "rights_id" UUID NOT NULL,
    "signer_id" UUID NOT NULL,
    "signer_role" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_email" TEXT NOT NULL,
    "signature_type" "SignatureType" NOT NULL,
    "signature_data" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "accepted_terms" BOOLEAN NOT NULL DEFAULT false,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rights_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rights_history" (
    "id" UUID NOT NULL,
    "rights_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "previous_status" "RightsStatus",
    "new_status" "RightsStatus",
    "performed_by" UUID NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,

    CONSTRAINT "rights_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rights_transfers" (
    "id" UUID NOT NULL,
    "rights_id" UUID NOT NULL,
    "transfer_from" UUID NOT NULL,
    "transfer_to" UUID NOT NULL,
    "transfer_type" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "effective_date" TIMESTAMP(3) NOT NULL,
    "compensation_amount" DECIMAL(12,2),
    "compensation_currency" TEXT DEFAULT 'USD',
    "creator_consent" BOOLEAN NOT NULL DEFAULT false,
    "creator_consent_at" TIMESTAMP(3),
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "transfer_document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rights_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "LicenseTemplateType" NOT NULL,
    "default_rights_type" "RightsType" NOT NULL DEFAULT 'NON_EXCLUSIVE',
    "default_duration_days" INTEGER,
    "default_platforms" TEXT[],
    "default_territories" TEXT[],
    "html_template" TEXT NOT NULL,
    "css_styles" TEXT,
    "variables" TEXT[],
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" UUID NOT NULL,
    "rights_id" UUID NOT NULL,
    "template_id" UUID,
    "document_type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "preview_url" TEXT,
    "file_size" INTEGER,
    "checksum" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "custom_clauses" TEXT[],
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_tracking" (
    "id" UUID NOT NULL,
    "rights_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "usage_type" "UsageType" NOT NULL,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "clicks" BIGINT NOT NULL DEFAULT 0,
    "engagement" BIGINT NOT NULL DEFAULT 0,
    "spend" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "tracking_url" TEXT,
    "external_campaign_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rights_disputes" (
    "id" UUID NOT NULL,
    "rights_id" UUID NOT NULL,
    "raised_by" UUID NOT NULL,
    "dispute_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rights_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_rights_content_id_idx" ON "content_rights"("content_id");

-- CreateIndex
CREATE INDEX "content_rights_creator_id_idx" ON "content_rights"("creator_id");

-- CreateIndex
CREATE INDEX "content_rights_brand_id_idx" ON "content_rights"("brand_id");

-- CreateIndex
CREATE INDEX "content_rights_campaign_id_idx" ON "content_rights"("campaign_id");

-- CreateIndex
CREATE INDEX "content_rights_status_idx" ON "content_rights"("status");

-- CreateIndex
CREATE INDEX "content_rights_end_date_idx" ON "content_rights"("end_date");

-- CreateIndex
CREATE INDEX "rights_signatures_rights_id_idx" ON "rights_signatures"("rights_id");

-- CreateIndex
CREATE INDEX "rights_signatures_signer_id_idx" ON "rights_signatures"("signer_id");

-- CreateIndex
CREATE INDEX "rights_history_rights_id_idx" ON "rights_history"("rights_id");

-- CreateIndex
CREATE INDEX "rights_history_performed_at_idx" ON "rights_history"("performed_at");

-- CreateIndex
CREATE INDEX "rights_transfers_rights_id_idx" ON "rights_transfers"("rights_id");

-- CreateIndex
CREATE INDEX "rights_transfers_transfer_from_idx" ON "rights_transfers"("transfer_from");

-- CreateIndex
CREATE INDEX "rights_transfers_transfer_to_idx" ON "rights_transfers"("transfer_to");

-- CreateIndex
CREATE INDEX "rights_transfers_status_idx" ON "rights_transfers"("status");

-- CreateIndex
CREATE INDEX "license_templates_organization_id_idx" ON "license_templates"("organization_id");

-- CreateIndex
CREATE INDEX "license_templates_type_idx" ON "license_templates"("type");

-- CreateIndex
CREATE INDEX "generated_documents_rights_id_idx" ON "generated_documents"("rights_id");

-- CreateIndex
CREATE INDEX "usage_tracking_rights_id_idx" ON "usage_tracking"("rights_id");

-- CreateIndex
CREATE INDEX "usage_tracking_platform_idx" ON "usage_tracking"("platform");

-- CreateIndex
CREATE INDEX "usage_tracking_period_start_idx" ON "usage_tracking"("period_start");

-- CreateIndex
CREATE INDEX "rights_disputes_rights_id_idx" ON "rights_disputes"("rights_id");

-- CreateIndex
CREATE INDEX "rights_disputes_status_idx" ON "rights_disputes"("status");

-- AddForeignKey
ALTER TABLE "content_rights" ADD CONSTRAINT "content_rights_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "license_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_signatures" ADD CONSTRAINT "rights_signatures_rights_id_fkey" FOREIGN KEY ("rights_id") REFERENCES "content_rights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_history" ADD CONSTRAINT "rights_history_rights_id_fkey" FOREIGN KEY ("rights_id") REFERENCES "content_rights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_transfers" ADD CONSTRAINT "rights_transfers_rights_id_fkey" FOREIGN KEY ("rights_id") REFERENCES "content_rights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_rights_id_fkey" FOREIGN KEY ("rights_id") REFERENCES "content_rights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "license_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_rights_id_fkey" FOREIGN KEY ("rights_id") REFERENCES "content_rights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_disputes" ADD CONSTRAINT "rights_disputes_rights_id_fkey" FOREIGN KEY ("rights_id") REFERENCES "content_rights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
