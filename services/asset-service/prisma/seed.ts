// =============================================================================
// Asset Service - Database Seed Script
// =============================================================================
// Usage: npx prisma db seed
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Test organization and user IDs (should match other services)
const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_BRAND_USER_ID = '550e8400-e29b-41d4-a716-446655440010';
const TEST_CREATOR_USER_ID = '550e8400-e29b-41d4-a716-446655440020';

async function main() {
  console.log('🌱 Seeding asset-service database...');

  // Create storage quota for test organization
  const storageQuota = await prisma.storageQuota.upsert({
    where: { organizationId: TEST_ORG_ID },
    update: {},
    create: {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      usedBytes: BigInt(1073741824), // 1 GB
      quotaBytes: BigInt(107374182400), // 100 GB
      assetCount: 25,
    },
  });
  console.log('✅ Storage quota created');

  // Create folder structure
  const rootFolder = await prisma.assetFolder.upsert({
    where: {
      organizationId_path: {
        organizationId: TEST_ORG_ID,
        path: '/Brand Assets',
      },
    },
    update: {},
    create: {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      name: 'Brand Assets',
      path: '/Brand Assets',
      createdBy: TEST_BRAND_USER_ID,
      assetCount: 10,
    },
  });

  const campaignFolder = await prisma.assetFolder.upsert({
    where: {
      organizationId_path: {
        organizationId: TEST_ORG_ID,
        path: '/Brand Assets/Summer Campaign 2024',
      },
    },
    update: {},
    create: {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      name: 'Summer Campaign 2024',
      parentId: rootFolder.id,
      path: '/Brand Assets/Summer Campaign 2024',
      createdBy: TEST_BRAND_USER_ID,
      assetCount: 5,
    },
  });

  const logosFolder = await prisma.assetFolder.upsert({
    where: {
      organizationId_path: {
        organizationId: TEST_ORG_ID,
        path: '/Brand Assets/Logos',
      },
    },
    update: {},
    create: {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      name: 'Logos',
      parentId: rootFolder.id,
      path: '/Brand Assets/Logos',
      createdBy: TEST_BRAND_USER_ID,
      assetCount: 3,
    },
  });
  console.log('✅ Folder structure created');

  // Create sample assets
  const assets = [
    {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      uploadedBy: TEST_CREATOR_USER_ID,
      originalFilename: 'product-review-video.mp4',
      filename: 'asset_001_product-review-video.mp4',
      mimeType: 'video/mp4',
      fileSize: BigInt(52428800), // 50 MB
      type: 'VIDEO' as const,
      category: 'CONTENT' as const,
      status: 'READY' as const,
      blobUrl: 'https://creatorbridge.blob.core.windows.net/uploads/asset_001.mp4',
      cdnUrl: 'https://cdn.creatorbridge.com/assets/asset_001.mp4',
      duration: 45.5,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 8000000,
      codec: 'h264',
      hasAudio: true,
      thumbnailUrl: 'https://cdn.creatorbridge.com/thumbnails/asset_001_thumb.jpg',
      previewUrl: 'https://cdn.creatorbridge.com/previews/asset_001_preview.mp4',
      transcodingComplete: true,
      thumbnailsGenerated: true,
      moderationPassed: true,
      aiTags: ['product', 'review', 'unboxing', 'lifestyle'],
      aiDescription: 'A product review video featuring unboxing and demonstration',
      aiQualityScore: 0.85,
    },
    {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      uploadedBy: TEST_CREATOR_USER_ID,
      originalFilename: 'lifestyle-photo.jpg',
      filename: 'asset_002_lifestyle-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: BigInt(2097152), // 2 MB
      type: 'IMAGE' as const,
      category: 'CONTENT' as const,
      status: 'READY' as const,
      blobUrl: 'https://creatorbridge.blob.core.windows.net/uploads/asset_002.jpg',
      cdnUrl: 'https://cdn.creatorbridge.com/assets/asset_002.jpg',
      width: 3840,
      height: 2160,
      thumbnailUrl: 'https://cdn.creatorbridge.com/thumbnails/asset_002_thumb.jpg',
      transcodingComplete: true,
      thumbnailsGenerated: true,
      moderationPassed: true,
      dominantColors: ['#F5E6D3', '#8B7355', '#2C1810'],
      blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      aiTags: ['lifestyle', 'product', 'aesthetic', 'minimalist'],
      aiQualityScore: 0.92,
    },
    {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      uploadedBy: TEST_BRAND_USER_ID,
      originalFilename: 'brand-logo.png',
      filename: 'asset_003_brand-logo.png',
      mimeType: 'image/png',
      fileSize: BigInt(524288), // 512 KB
      type: 'IMAGE' as const,
      category: 'BRAND_ASSET' as const,
      status: 'READY' as const,
      blobUrl: 'https://creatorbridge.blob.core.windows.net/uploads/asset_003.png',
      cdnUrl: 'https://cdn.creatorbridge.com/assets/asset_003.png',
      width: 1200,
      height: 630,
      thumbnailUrl: 'https://cdn.creatorbridge.com/thumbnails/asset_003_thumb.png',
      transcodingComplete: true,
      thumbnailsGenerated: true,
      moderationPassed: true,
      aiTags: ['logo', 'brand', 'corporate'],
      aiQualityScore: 0.95,
    },
    {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      uploadedBy: TEST_CREATOR_USER_ID,
      originalFilename: 'tutorial-video.mp4',
      filename: 'asset_004_tutorial-video.mp4',
      mimeType: 'video/mp4',
      fileSize: BigInt(104857600), // 100 MB
      type: 'VIDEO' as const,
      category: 'CONTENT' as const,
      status: 'PROCESSING' as const,
      blobUrl: 'https://creatorbridge.blob.core.windows.net/uploads/asset_004.mp4',
      duration: 180.0,
      width: 1920,
      height: 1080,
      fps: 30,
      hasAudio: true,
      transcodingComplete: false,
      thumbnailsGenerated: false,
    },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {},
      create: asset,
    });
  }
  console.log(`✅ ${assets.length} sample assets created`);

  // Create asset variants for completed video
  const videoAsset = assets[0];
  const variants = [
    {
      id: randomUUID(),
      assetId: videoAsset.id,
      name: 'hd',
      resolution: '1080p',
      width: 1920,
      height: 1080,
      fileSize: BigInt(52428800),
      bitrate: 8000000,
      format: 'mp4',
      blobUrl: 'https://creatorbridge.blob.core.windows.net/variants/asset_001_1080p.mp4',
      cdnUrl: 'https://cdn.creatorbridge.com/variants/asset_001_1080p.mp4',
    },
    {
      id: randomUUID(),
      assetId: videoAsset.id,
      name: 'sd',
      resolution: '720p',
      width: 1280,
      height: 720,
      fileSize: BigInt(26214400),
      bitrate: 4000000,
      format: 'mp4',
      blobUrl: 'https://creatorbridge.blob.core.windows.net/variants/asset_001_720p.mp4',
      cdnUrl: 'https://cdn.creatorbridge.com/variants/asset_001_720p.mp4',
    },
    {
      id: randomUUID(),
      assetId: videoAsset.id,
      name: 'mobile',
      resolution: '480p',
      width: 854,
      height: 480,
      fileSize: BigInt(10485760),
      bitrate: 2000000,
      format: 'mp4',
      blobUrl: 'https://creatorbridge.blob.core.windows.net/variants/asset_001_480p.mp4',
      cdnUrl: 'https://cdn.creatorbridge.com/variants/asset_001_480p.mp4',
    },
  ];

  for (const variant of variants) {
    await prisma.assetVariant.upsert({
      where: {
        assetId_name: {
          assetId: variant.assetId,
          name: variant.name,
        },
      },
      update: {},
      create: variant,
    });
  }
  console.log(`✅ ${variants.length} asset variants created`);

  // Create processing job for the processing asset
  const processingAsset = assets[3];
  await prisma.processingJob.create({
    data: {
      id: randomUUID(),
      assetId: processingAsset.id,
      type: 'TRANSCODE',
      status: 'PROCESSING',
      progress: 45,
      priority: 5,
      inputConfig: {
        sourceUrl: processingAsset.blobUrl,
        format: 'mp4',
      },
      outputConfig: {
        variants: ['1080p', '720p', '480p'],
        generateThumbnails: true,
      },
    },
  });
  console.log('✅ Processing job created');

  console.log('');
  console.log('🎉 Asset service seeding completed!');
  console.log('');
  console.log('Summary:');
  console.log(`  - Storage quota: 1 GB / 100 GB`);
  console.log(`  - Folders: 3`);
  console.log(`  - Assets: ${assets.length}`);
  console.log(`  - Variants: ${variants.length}`);
  console.log(`  - Processing jobs: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
