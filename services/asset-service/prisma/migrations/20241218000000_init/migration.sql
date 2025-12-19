-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('VIDEO', 'IMAGE', 'AUDIO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('CONTENT', 'BRAND_ASSET', 'PORTFOLIO', 'THUMBNAIL', 'AVATAR');

-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProcessingJobType" AS ENUM ('TRANSCODE', 'THUMBNAIL', 'PREVIEW', 'MODERATION', 'METADATA');

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "original_filename" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "type" "AssetType" NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'UPLOADING',
    "blob_url" TEXT NOT NULL,
    "cdn_url" TEXT,
    "checksum" TEXT,
    "duration" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "fps" DOUBLE PRECISION,
    "bitrate" INTEGER,
    "codec" TEXT,
    "color_space" TEXT,
    "has_audio" BOOLEAN DEFAULT false,
    "thumbnail_url" TEXT,
    "preview_url" TEXT,
    "poster_url" TEXT,
    "blurhash" TEXT,
    "dominant_colors" TEXT[],
    "ai_tags" TEXT[],
    "ai_description" TEXT,
    "ai_moderation_score" DOUBLE PRECISION,
    "ai_quality_score" DOUBLE PRECISION,
    "transcoding_complete" BOOLEAN NOT NULL DEFAULT false,
    "thumbnails_generated" BOOLEAN NOT NULL DEFAULT false,
    "moderation_passed" BOOLEAN,
    "moderation_reviewed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_variants" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "resolution" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "file_size" BIGINT NOT NULL,
    "bitrate" INTEGER,
    "format" TEXT NOT NULL,
    "blob_url" TEXT NOT NULL,
    "cdn_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_folders" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "path" TEXT NOT NULL,
    "asset_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "type" "ProcessingJobType" NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "input_config" JSONB,
    "output_config" JSONB,
    "result" JSONB,
    "error_message" TEXT,
    "error_code" TEXT,
    "worker_id" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_usage" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "used_in_type" TEXT NOT NULL,
    "used_in_id" UUID NOT NULL,
    "context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_sessions" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "upload_url" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "chunk_size" INTEGER,
    "total_chunks" INTEGER,
    "uploaded_chunks" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_quotas" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "quota_bytes" BIGINT NOT NULL,
    "asset_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_organization_id_idx" ON "assets"("organization_id");

-- CreateIndex
CREATE INDEX "assets_uploaded_by_idx" ON "assets"("uploaded_by");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_created_at_idx" ON "assets"("created_at");

-- CreateIndex
CREATE INDEX "asset_variants_asset_id_idx" ON "asset_variants"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_variants_asset_id_name_key" ON "asset_variants"("asset_id", "name");

-- CreateIndex
CREATE INDEX "asset_folders_organization_id_idx" ON "asset_folders"("organization_id");

-- CreateIndex
CREATE INDEX "asset_folders_parent_id_idx" ON "asset_folders"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_folders_organization_id_path_key" ON "asset_folders"("organization_id", "path");

-- CreateIndex
CREATE INDEX "processing_jobs_asset_id_idx" ON "processing_jobs"("asset_id");

-- CreateIndex
CREATE INDEX "processing_jobs_status_idx" ON "processing_jobs"("status");

-- CreateIndex
CREATE INDEX "processing_jobs_type_idx" ON "processing_jobs"("type");

-- CreateIndex
CREATE INDEX "processing_jobs_priority_created_at_idx" ON "processing_jobs"("priority", "created_at");

-- CreateIndex
CREATE INDEX "asset_usage_asset_id_idx" ON "asset_usage"("asset_id");

-- CreateIndex
CREATE INDEX "asset_usage_used_in_type_used_in_id_idx" ON "asset_usage"("used_in_type", "used_in_id");

-- CreateIndex
CREATE UNIQUE INDEX "upload_sessions_asset_id_key" ON "upload_sessions"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_quotas_organization_id_key" ON "storage_quotas"("organization_id");

-- AddForeignKey
ALTER TABLE "asset_variants" ADD CONSTRAINT "asset_variants_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_folders" ADD CONSTRAINT "asset_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "asset_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_usage" ADD CONSTRAINT "asset_usage_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
