// =============================================================================
// Rights Service - Database Seed Script
// =============================================================================
// Usage: npx prisma db seed
// =============================================================================

import { PrismaClient } from '.prisma/rights-service-client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Test IDs (should match other services)
const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_BRAND_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEST_CREATOR_ID = '550e8400-e29b-41d4-a716-446655440020';
const TEST_CAMPAIGN_ID = '550e8400-e29b-41d4-a716-446655440030';
const TEST_CONTENT_ID_1 = '550e8400-e29b-41d4-a716-446655440040';
const TEST_CONTENT_ID_2 = '550e8400-e29b-41d4-a716-446655440041';

async function main() {
  console.log('🌱 Seeding rights-service database...');

  // Create license templates
  const templates = [
    {
      id: randomUUID(),
      organizationId: null, // System-wide template
      name: 'Standard Non-Exclusive License',
      description: 'Standard license for non-exclusive usage rights across social media platforms',
      type: 'STANDARD_NON_EXCLUSIVE' as const,
      defaultRightsType: 'NON_EXCLUSIVE' as const,
      defaultDurationDays: 365,
      defaultPlatforms: ['instagram', 'tiktok', 'facebook', 'youtube'],
      defaultTerritories: ['US', 'CA', 'UK', 'AU'],
      htmlTemplate: `
        <h1>Content License Agreement</h1>
        <p>This Non-Exclusive License Agreement ("Agreement") is entered into as of {{effectiveDate}}.</p>
        <h2>1. Grant of License</h2>
        <p>Creator grants Brand a non-exclusive license to use the Content for the following purposes:</p>
        <ul>
          {{#each usageTypes}}<li>{{this}}</li>{{/each}}
        </ul>
        <h2>2. Territory</h2>
        <p>This license is valid in the following territories: {{territories}}</p>
        <h2>3. Duration</h2>
        <p>This license is valid from {{startDate}} to {{endDate}}.</p>
        <h2>4. Compensation</h2>
        <p>Brand agrees to pay Creator {{compensationAmount}} {{currency}} for this license.</p>
      `,
      variables: ['effectiveDate', 'usageTypes', 'territories', 'startDate', 'endDate', 'compensationAmount', 'currency'],
      isDefault: true,
      isActive: true,
    },
    {
      id: randomUUID(),
      organizationId: null,
      name: 'Exclusive Full Buyout',
      description: 'Full exclusive rights transfer for all platforms and territories',
      type: 'FULL_BUYOUT' as const,
      defaultRightsType: 'EXCLUSIVE' as const,
      defaultDurationDays: null, // Perpetual
      defaultPlatforms: ['all'],
      defaultTerritories: ['worldwide'],
      htmlTemplate: `
        <h1>Exclusive Content Buyout Agreement</h1>
        <p>This Exclusive Buyout Agreement transfers all rights to the Content from Creator to Brand.</p>
        <h2>1. Full Rights Transfer</h2>
        <p>Creator hereby transfers all rights, title, and interest in the Content to Brand.</p>
        <h2>2. Perpetual License</h2>
        <p>This transfer is perpetual and irrevocable.</p>
        <h2>3. Compensation</h2>
        <p>Brand agrees to pay Creator {{compensationAmount}} {{currency}} for this buyout.</p>
      `,
      variables: ['compensationAmount', 'currency'],
      isDefault: false,
      isActive: true,
    },
    {
      id: randomUUID(),
      organizationId: TEST_ORG_ID,
      name: 'Custom Social Media License',
      description: 'Custom template for social media campaigns only',
      type: 'LIMITED_SOCIAL' as const,
      defaultRightsType: 'LIMITED' as const,
      defaultDurationDays: 90,
      defaultPlatforms: ['instagram', 'tiktok'],
      defaultTerritories: ['US'],
      htmlTemplate: `
        <h1>Social Media License Agreement</h1>
        <p>Limited license for social media usage only.</p>
        <h2>Platforms</h2>
        <p>{{platforms}}</p>
        <h2>Duration</h2>
        <p>{{duration}} days from {{startDate}}</p>
      `,
      variables: ['platforms', 'duration', 'startDate'],
      isDefault: false,
      isActive: true,
    },
  ];

  for (const template of templates) {
    await prisma.licenseTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: template,
    });
  }
  console.log(`✅ ${templates.length} license templates created`);

  // Create content rights records
  const rightsRecords = [
    {
      id: randomUUID(),
      contentId: TEST_CONTENT_ID_1,
      creatorId: TEST_CREATOR_ID,
      brandId: TEST_BRAND_ID,
      campaignId: TEST_CAMPAIGN_ID,
      type: 'NON_EXCLUSIVE' as const,
      status: 'ACTIVE' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isPerpetual: false,
      territories: ['US', 'CA', 'UK'],
      platforms: ['instagram', 'tiktok', 'facebook'],
      usageTypes: ['ORGANIC_SOCIAL', 'PAID_SOCIAL'],
      noEditing: false,
      noDerivatives: false,
      attributionRequired: true,
      compensationType: 'flat_fee',
      compensationAmount: 500.00,
      compensationCurrency: 'USD',
      templateId: templates[0].id,
      licenseDocumentUrl: 'https://docs.creatorbridge.com/licenses/lic_001.pdf',
      signedDocumentUrl: 'https://docs.creatorbridge.com/licenses/lic_001_signed.pdf',
    },
    {
      id: randomUUID(),
      contentId: TEST_CONTENT_ID_2,
      creatorId: TEST_CREATOR_ID,
      brandId: TEST_BRAND_ID,
      campaignId: TEST_CAMPAIGN_ID,
      type: 'EXCLUSIVE' as const,
      status: 'PENDING_SIGNATURE' as const,
      startDate: new Date('2024-06-01'),
      endDate: null,
      isPerpetual: true,
      territories: ['worldwide'],
      platforms: ['all'],
      usageTypes: ['ORGANIC_SOCIAL', 'PAID_SOCIAL', 'WEBSITE', 'EMAIL', 'DISPLAY_ADS'],
      noEditing: true,
      noDerivatives: true,
      attributionRequired: false,
      compensationType: 'flat_fee',
      compensationAmount: 2500.00,
      compensationCurrency: 'USD',
      templateId: templates[1].id,
      licenseDocumentUrl: 'https://docs.creatorbridge.com/licenses/lic_002.pdf',
    },
  ];

  for (const rights of rightsRecords) {
    await prisma.contentRights.upsert({
      where: { id: rights.id },
      update: {},
      create: rights,
    });
  }
  console.log(`✅ ${rightsRecords.length} content rights records created`);

  // Create signatures for the active rights
  const activeRights = rightsRecords[0];
  const signatures = [
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      signerId: TEST_CREATOR_ID,
      signerRole: 'creator',
      signerName: 'Test Creator',
      signerEmail: 'creator@test.creatorbridge.com',
      signatureType: 'TYPED' as const,
      signatureData: 'Test Creator',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      acceptedTerms: true,
      signedAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      signerId: TEST_BRAND_ID,
      signerRole: 'brand',
      signerName: 'Test Brand Representative',
      signerEmail: 'brand@test.creatorbridge.com',
      signatureType: 'ELECTRONIC' as const,
      signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      acceptedTerms: true,
      signedAt: new Date('2024-01-01T14:00:00Z'),
    },
  ];

  for (const signature of signatures) {
    await prisma.rightsSignature.create({
      data: signature,
    });
  }
  console.log(`✅ ${signatures.length} signatures created`);

  // Create rights history
  const historyEntries = [
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      action: 'created',
      previousStatus: null,
      newStatus: 'DRAFT' as const,
      performedBy: TEST_BRAND_ID,
      reason: 'Initial rights configuration',
    },
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      action: 'license_generated',
      previousStatus: 'DRAFT' as const,
      newStatus: 'PENDING_SIGNATURE' as const,
      performedBy: TEST_BRAND_ID,
      reason: 'License agreement generated and sent for signature',
    },
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      action: 'creator_signed',
      previousStatus: 'PENDING_SIGNATURE' as const,
      newStatus: 'PENDING_SIGNATURE' as const,
      performedBy: TEST_CREATOR_ID,
      reason: 'Creator signed the agreement',
    },
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      action: 'brand_signed',
      previousStatus: 'PENDING_SIGNATURE' as const,
      newStatus: 'ACTIVE' as const,
      performedBy: TEST_BRAND_ID,
      reason: 'Brand signed the agreement - all parties signed',
    },
  ];

  for (const entry of historyEntries) {
    await prisma.rightsHistory.create({
      data: entry,
    });
  }
  console.log(`✅ ${historyEntries.length} history entries created`);

  // Create usage tracking
  const usageRecords = [
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      platform: 'instagram',
      usageType: 'ORGANIC_SOCIAL' as const,
      impressions: BigInt(150000),
      clicks: BigInt(3500),
      engagement: BigInt(12000),
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    },
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      platform: 'tiktok',
      usageType: 'ORGANIC_SOCIAL' as const,
      impressions: BigInt(500000),
      clicks: BigInt(15000),
      engagement: BigInt(45000),
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    },
    {
      id: randomUUID(),
      rightsId: activeRights.id,
      platform: 'facebook',
      usageType: 'PAID_SOCIAL' as const,
      impressions: BigInt(250000),
      clicks: BigInt(8000),
      engagement: BigInt(5000),
      spend: 1500.00,
      currency: 'USD',
      externalCampaignId: 'fb_camp_12345',
      periodStart: new Date('2024-02-01'),
      periodEnd: new Date('2024-02-29'),
    },
  ];

  for (const usage of usageRecords) {
    await prisma.usageTracking.create({
      data: usage,
    });
  }
  console.log(`✅ ${usageRecords.length} usage tracking records created`);

  // Create a generated document
  await prisma.generatedDocument.create({
    data: {
      id: randomUUID(),
      rightsId: activeRights.id,
      templateId: templates[0].id,
      documentType: 'license_agreement',
      format: 'pdf',
      fileUrl: 'https://docs.creatorbridge.com/licenses/lic_001.pdf',
      previewUrl: 'https://docs.creatorbridge.com/licenses/lic_001_preview.png',
      fileSize: 156000,
      language: 'en',
      customClauses: ['Content may not be used in tobacco or alcohol advertising.'],
      expiresAt: new Date('2025-01-01'),
    },
  });
  console.log('✅ Generated document created');

  console.log('');
  console.log('🎉 Rights service seeding completed!');
  console.log('');
  console.log('Summary:');
  console.log(`  - License templates: ${templates.length}`);
  console.log(`  - Content rights: ${rightsRecords.length}`);
  console.log(`  - Signatures: ${signatures.length}`);
  console.log(`  - History entries: ${historyEntries.length}`);
  console.log(`  - Usage tracking: ${usageRecords.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
