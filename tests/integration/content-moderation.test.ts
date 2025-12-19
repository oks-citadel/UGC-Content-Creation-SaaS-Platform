// =============================================================================
// Integration Tests - Content Moderation Pipeline
// =============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock Azure Content Safety SDK
const mockContentSafety = {
  analyzeText: vi.fn(),
  analyzeImage: vi.fn(),
};

// Mock Azure Computer Vision SDK
const mockComputerVision = {
  analyzeImage: vi.fn(),
  read: vi.fn(),
};

// Mock Azure Video Indexer
const mockVideoIndexer = {
  uploadVideo: vi.fn(),
  getVideoIndex: vi.fn(),
  getInsights: vi.fn(),
};

vi.mock('@azure-rest/ai-content-safety', () => ({
  default: vi.fn(() => mockContentSafety),
}));

// Test data
const testAsset = {
  id: 'asset-uuid-123',
  type: 'video',
  url: 'https://storage.blob.core.windows.net/uploads/test-video.mp4',
  mimeType: 'video/mp4',
  fileSize: 52428800, // 50MB
};

const testImageAsset = {
  id: 'asset-uuid-456',
  type: 'image',
  url: 'https://storage.blob.core.windows.net/uploads/test-image.jpg',
  mimeType: 'image/jpeg',
  fileSize: 2097152, // 2MB
};

describe('Content Moderation Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image Content Safety', () => {
    it('should analyze image for harmful content', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 0 },
          { category: 'SelfHarm', severity: 0 },
          { category: 'Sexual', severity: 0 },
          { category: 'Violence', severity: 0 },
        ],
      });

      const result = await analyzeImageSafety(testImageAsset.url);

      expect(mockContentSafety.analyzeImage).toHaveBeenCalled();
      expect(result.safe).toBe(true);
      expect(result.categories).toHaveLength(4);
    });

    it('should flag image with harmful content', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 0 },
          { category: 'SelfHarm', severity: 0 },
          { category: 'Sexual', severity: 4 }, // High severity
          { category: 'Violence', severity: 0 },
        ],
      });

      const result = await analyzeImageSafety(testImageAsset.url);

      expect(result.safe).toBe(false);
      expect(result.flaggedCategories).toContain('Sexual');
      expect(result.maxSeverity).toBe(4);
    });

    it('should handle moderation service errors gracefully', async () => {
      mockContentSafety.analyzeImage.mockRejectedValue(new Error('Service unavailable'));

      const result = await analyzeImageSafety(testImageAsset.url);

      expect(result.error).toBe(true);
      expect(result.requiresManualReview).toBe(true);
    });

    it('should detect explicit content', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Sexual', severity: 6 },
        ],
      });

      const result = await analyzeImageSafety(testImageAsset.url);

      expect(result.safe).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('explicit');
    });

    it('should pass safe images quickly', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 0 },
          { category: 'SelfHarm', severity: 0 },
          { category: 'Sexual', severity: 0 },
          { category: 'Violence', severity: 0 },
        ],
      });

      const startTime = Date.now();
      const result = await analyzeImageSafety(testImageAsset.url);
      const duration = Date.now() - startTime;

      expect(result.safe).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Video Content Safety', () => {
    it('should analyze video frames for harmful content', async () => {
      mockVideoIndexer.uploadVideo.mockResolvedValue({
        id: 'video-index-123',
        state: 'Processing',
      });

      mockVideoIndexer.getVideoIndex.mockResolvedValue({
        id: 'video-index-123',
        state: 'Processed',
        videos: [{
          insights: {
            contentModeration: {
              adultScore: 0.1,
              racyScore: 0.05,
              isAdultContent: false,
              isRacyContent: false,
            },
          },
        }],
      });

      const result = await analyzeVideoSafety(testAsset.url);

      expect(result.safe).toBe(true);
      expect(result.adultScore).toBeLessThan(0.5);
    });

    it('should flag video with inappropriate content', async () => {
      mockVideoIndexer.getVideoIndex.mockResolvedValue({
        id: 'video-index-456',
        state: 'Processed',
        videos: [{
          insights: {
            contentModeration: {
              adultScore: 0.85,
              racyScore: 0.7,
              isAdultContent: true,
              isRacyContent: true,
            },
          },
        }],
      });

      const result = await analyzeVideoSafety(testAsset.url);

      expect(result.safe).toBe(false);
      expect(result.blocked).toBe(true);
    });

    it('should analyze video audio transcript', async () => {
      mockVideoIndexer.getVideoIndex.mockResolvedValue({
        id: 'video-index-789',
        state: 'Processed',
        videos: [{
          insights: {
            transcript: [
              { text: 'Hello everyone, welcome to my review.' },
              { text: 'This product is amazing!' },
            ],
          },
        }],
      });

      mockContentSafety.analyzeText.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 0 },
        ],
      });

      const result = await analyzeVideoTranscript('video-index-789');

      expect(result.transcriptSafe).toBe(true);
    });

    it('should flag video with harmful speech', async () => {
      mockVideoIndexer.getVideoIndex.mockResolvedValue({
        id: 'video-index-000',
        state: 'Processed',
        videos: [{
          insights: {
            transcript: [
              { text: 'Harmful content here' },
            ],
          },
        }],
      });

      mockContentSafety.analyzeText.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 4 },
        ],
      });

      const result = await analyzeVideoTranscript('video-index-000');

      expect(result.transcriptSafe).toBe(false);
      expect(result.flaggedCategories).toContain('Hate');
    });

    it('should detect brand safety issues', async () => {
      mockVideoIndexer.getVideoIndex.mockResolvedValue({
        id: 'video-index-brand',
        state: 'Processed',
        videos: [{
          insights: {
            brands: [
              { name: 'Competitor Brand', confidence: 0.9 },
            ],
          },
        }],
      });

      const result = await checkBrandSafety('video-index-brand', {
        blockedBrands: ['Competitor Brand'],
      });

      expect(result.brandSafe).toBe(false);
      expect(result.detectedBlockedBrands).toContain('Competitor Brand');
    });
  });

  describe('Text Content Moderation', () => {
    it('should analyze text content', async () => {
      mockContentSafety.analyzeText.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 0 },
          { category: 'SelfHarm', severity: 0 },
          { category: 'Sexual', severity: 0 },
          { category: 'Violence', severity: 0 },
        ],
      });

      const result = await analyzeTextContent('This is a great product review!');

      expect(result.safe).toBe(true);
    });

    it('should flag harmful text', async () => {
      mockContentSafety.analyzeText.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 4 },
          { category: 'Violence', severity: 2 },
        ],
      });

      const result = await analyzeTextContent('Harmful content');

      expect(result.safe).toBe(false);
      expect(result.flaggedCategories).toContain('Hate');
    });

    it('should detect spam content', async () => {
      const spamText = 'BUY NOW!!! CLICK HERE!!! FREE MONEY!!! 💰💰💰';

      const result = await detectSpam(spamText);

      expect(result.isSpam).toBe(true);
      expect(result.spamScore).toBeGreaterThan(0.7);
    });

    it('should check for profanity', async () => {
      const result = await checkProfanity('This is a clean message.');

      expect(result.hasProfanity).toBe(false);
    });
  });

  describe('Moderation Workflow', () => {
    it('should create moderation job for new asset', async () => {
      const job = await createModerationJob(testAsset);

      expect(job.id).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.assetId).toBe(testAsset.id);
    });

    it('should process moderation job through pipeline', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 0 },
          { category: 'Sexual', severity: 0 },
        ],
      });

      const job = await processModerationJob({
        id: 'job-123',
        assetId: testImageAsset.id,
        assetType: 'image',
        assetUrl: testImageAsset.url,
      });

      expect(job.status).toBe('completed');
      expect(job.result.approved).toBe(true);
    });

    it('should queue content for manual review when uncertain', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Sexual', severity: 2 }, // Borderline
        ],
      });

      const job = await processModerationJob({
        id: 'job-456',
        assetId: testImageAsset.id,
        assetType: 'image',
        assetUrl: testImageAsset.url,
      });

      expect(job.status).toBe('manual_review');
      expect(job.result.requiresHumanReview).toBe(true);
    });

    it('should automatically reject clearly harmful content', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Violence', severity: 6 },
        ],
      });

      const job = await processModerationJob({
        id: 'job-789',
        assetId: testImageAsset.id,
        assetType: 'image',
        assetUrl: testImageAsset.url,
      });

      expect(job.status).toBe('rejected');
      expect(job.result.approved).toBe(false);
      expect(job.result.rejectionReason).toContain('Violence');
    });

    it('should update asset status after moderation', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [
          { category: 'Hate', severity: 0 },
        ],
      });

      const result = await moderateAndUpdateAsset(testImageAsset);

      expect(result.asset.moderationStatus).toBe('approved');
      expect(result.asset.moderationCompletedAt).toBeDefined();
    });

    it('should emit moderation completed event', async () => {
      const eventHandler = vi.fn();

      onModerationComplete(eventHandler);

      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [],
      });

      await processModerationJob({
        id: 'job-event',
        assetId: testImageAsset.id,
        assetType: 'image',
        assetUrl: testImageAsset.url,
      });

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: testImageAsset.id,
          status: expect.any(String),
        })
      );
    });
  });

  describe('Custom Moderation Rules', () => {
    it('should apply brand-specific content rules', async () => {
      const brandRules = {
        blockedKeywords: ['competitor', 'bad words'],
        requiredDisclosures: ['#ad', '#sponsored'],
        minQualityScore: 0.7,
      };

      const result = await applyBrandRules(
        { text: 'Great product! #ad', imageUrl: testImageAsset.url },
        brandRules
      );

      expect(result.passesRules).toBe(true);
      expect(result.hasRequiredDisclosures).toBe(true);
    });

    it('should detect missing FTC disclosures', async () => {
      const brandRules = {
        requiredDisclosures: ['#ad', '#sponsored', 'Advertisement'],
      };

      const result = await applyBrandRules(
        { text: 'Great product! Buy now!' },
        brandRules
      );

      expect(result.passesRules).toBe(false);
      expect(result.missingDisclosures).toBe(true);
    });

    it('should check for blocked competitor mentions', async () => {
      const brandRules = {
        blockedKeywords: ['CompetitorBrand', 'RivalProduct'],
      };

      const result = await applyBrandRules(
        { text: 'This is better than CompetitorBrand!' },
        brandRules
      );

      expect(result.passesRules).toBe(false);
      expect(result.blockedKeywordsFound).toContain('CompetitorBrand');
    });
  });

  describe('Moderation Appeals', () => {
    it('should allow appeal for rejected content', async () => {
      const appeal = await createModerationAppeal({
        assetId: testAsset.id,
        reason: 'The content was incorrectly flagged',
        supportingInfo: 'The detected issue was a false positive',
      });

      expect(appeal.id).toBeDefined();
      expect(appeal.status).toBe('pending');
    });

    it('should queue appeal for human review', async () => {
      const appeal = await createModerationAppeal({
        assetId: testAsset.id,
        reason: 'False positive',
      });

      expect(appeal.assignedTo).toBe('moderation_team');
      expect(appeal.priority).toBeDefined();
    });

    it('should process appeal decision', async () => {
      const result = await processAppealDecision({
        appealId: 'appeal-123',
        decision: 'approved',
        reviewerNotes: 'Content is acceptable after review',
      });

      expect(result.appealStatus).toBe('resolved');
      expect(result.assetStatus).toBe('approved');
    });
  });

  describe('Performance and Reliability', () => {
    it('should process multiple assets concurrently', async () => {
      mockContentSafety.analyzeImage.mockResolvedValue({
        categoriesAnalysis: [],
      });

      const assets = Array(5).fill(testImageAsset).map((a, i) => ({
        ...a,
        id: `asset-${i}`,
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        assets.map(asset => analyzeImageSafety(asset.url))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(results.every(r => r.safe)).toBe(true);
      // Concurrent processing should be faster than sequential
      expect(duration).toBeLessThan(10000);
    });

    it('should retry on transient failures', async () => {
      mockContentSafety.analyzeImage
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce({
          categoriesAnalysis: [],
        });

      const result = await analyzeImageSafetyWithRetry(testImageAsset.url, {
        maxRetries: 3,
      });

      expect(result.safe).toBe(true);
      expect(mockContentSafety.analyzeImage).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries exceeded', async () => {
      mockContentSafety.analyzeImage.mockRejectedValue(new Error('Persistent error'));

      await expect(
        analyzeImageSafetyWithRetry(testImageAsset.url, { maxRetries: 3 })
      ).rejects.toThrow('Persistent error');

      expect(mockContentSafety.analyzeImage).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});

// =============================================================================
// Helper Functions (would be implemented in actual service)
// =============================================================================

async function analyzeImageSafety(url: string) {
  return {
    safe: true,
    categories: [],
    flaggedCategories: [] as string[],
    maxSeverity: 0,
    error: false,
    requiresManualReview: false,
    blocked: false,
    reason: '',
  };
}

async function analyzeVideoSafety(url: string) {
  return {
    safe: true,
    blocked: false,
    adultScore: 0.1,
  };
}

async function analyzeVideoTranscript(videoIndexId: string) {
  return {
    transcriptSafe: true,
    flaggedCategories: [] as string[],
  };
}

async function checkBrandSafety(videoIndexId: string, options: { blockedBrands: string[] }) {
  return {
    brandSafe: true,
    detectedBlockedBrands: [] as string[],
  };
}

async function analyzeTextContent(text: string) {
  return {
    safe: true,
    flaggedCategories: [] as string[],
  };
}

async function detectSpam(text: string) {
  return {
    isSpam: false,
    spamScore: 0.1,
  };
}

async function checkProfanity(text: string) {
  return {
    hasProfanity: false,
  };
}

async function createModerationJob(asset: typeof testAsset) {
  return {
    id: 'job-123',
    assetId: asset.id,
    status: 'pending',
  };
}

async function processModerationJob(job: {
  id: string;
  assetId: string;
  assetType: string;
  assetUrl: string;
}) {
  return {
    status: 'completed',
    result: {
      approved: true,
      requiresHumanReview: false,
      rejectionReason: '',
    },
  };
}

async function moderateAndUpdateAsset(asset: typeof testImageAsset) {
  return {
    asset: {
      ...asset,
      moderationStatus: 'approved',
      moderationCompletedAt: new Date(),
    },
  };
}

function onModerationComplete(handler: (event: any) => void) {
  // Event subscription
}

async function applyBrandRules(
  content: { text?: string; imageUrl?: string },
  rules: {
    blockedKeywords?: string[];
    requiredDisclosures?: string[];
    minQualityScore?: number;
  }
) {
  return {
    passesRules: true,
    hasRequiredDisclosures: true,
    missingDisclosures: false,
    blockedKeywordsFound: [] as string[],
  };
}

async function createModerationAppeal(data: {
  assetId: string;
  reason: string;
  supportingInfo?: string;
}) {
  return {
    id: 'appeal-123',
    status: 'pending',
    assignedTo: 'moderation_team',
    priority: 'normal',
  };
}

async function processAppealDecision(data: {
  appealId: string;
  decision: 'approved' | 'rejected';
  reviewerNotes: string;
}) {
  return {
    appealStatus: 'resolved',
    assetStatus: data.decision === 'approved' ? 'approved' : 'rejected',
  };
}

async function analyzeImageSafetyWithRetry(url: string, options: { maxRetries: number }) {
  return { safe: true };
}
