import { Router } from 'express';
import { z } from 'zod';
import creatorService from '../services/creator.service';
import matchingService from '../services/matching.service';
import { authenticate, optionalAuth, requireCreator, requireSelfOrAdmin, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import logger from '../lib/logger';

const router: Router = Router();

// Validation Schemas
const createCreatorSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    displayName: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
    primaryNiche: z.string().optional(),
    secondaryNiches: z.array(z.string()).optional(),
    instagramHandle: z.string().optional(),
    tiktokHandle: z.string().optional(),
    youtubeHandle: z.string().optional(),
    twitterHandle: z.string().optional(),
    languages: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
  }),
});

const updateCreatorSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    displayName: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
    coverImage: z.string().url().optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
    primaryNiche: z.string().optional(),
    secondaryNiches: z.array(z.string()).optional(),
    instagramHandle: z.string().optional(),
    tiktokHandle: z.string().optional(),
    youtubeHandle: z.string().optional(),
    twitterHandle: z.string().optional(),
    facebookHandle: z.string().optional(),
    linkedinHandle: z.string().optional(),
    twitchHandle: z.string().optional(),
    yearsOfExperience: z.number().int().min(0).optional(),
    languages: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
    preferredBrands: z.array(z.string()).optional(),
    unwillingToWorkWith: z.array(z.string()).optional(),
    minCampaignBudget: z.number().min(0).optional(),
  }),
});

const portfolioItemSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    mediaType: z.enum(['IMAGE', 'VIDEO', 'LINK']),
    mediaUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    platform: z.string().optional(),
    externalUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    niche: z.string().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

const payoutRequestSchema = z.object({
  body: z.object({
    amount: z.number().min(0),
  }),
});

const matchingSchema = z.object({
  query: z.object({
    niche: z.string().optional(),
    niches: z.string().optional(), // comma-separated
    minFollowers: z.string().transform(Number).optional(),
    maxFollowers: z.string().transform(Number).optional(),
    minEngagementRate: z.string().transform(Number).optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    platforms: z.string().optional(), // comma-separated
    minReputationScore: z.string().transform(Number).optional(),
    budget: z.string().transform(Number).optional(),
    languages: z.string().optional(), // comma-separated
    limit: z.string().transform(Number).optional(),
  }),
});

// Creator Profile Routes
/**
 * POST /creators
 * Create a new creator profile
 */
router.post(
  '/',
  authenticate,
  validate(createCreatorSchema),
  asyncHandler(async (req, res) => {
    const creator = await creatorService.createCreator(req.body);

    logger.info({ creatorId: creator.id, userId: req.user?.id }, 'Creator profile created');

    res.status(201).json({
      status: 'success',
      data: { creator },
    });
  })
);

/**
 * GET /creators/:id
 * Get creator profile by ID
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { include } = req.query;

    const includeAll = include === 'all' || include === 'true';
    const creator = await creatorService.getCreator(id, includeAll);

    res.json({
      status: 'success',
      data: { creator },
    });
  })
);

/**
 * PUT /creators/:id
 * Update creator profile
 */
router.put(
  '/:id',
  authenticate,
  requireSelfOrAdmin,
  validate(updateCreatorSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const creator = await creatorService.updateCreator(id, req.body);

    logger.info({ creatorId: id, userId: req.user?.id }, 'Creator profile updated');

    res.json({
      status: 'success',
      data: { creator },
    });
  })
);

/**
 * DELETE /creators/:id
 * Delete creator profile
 */
router.delete(
  '/:id',
  authenticate,
  requireSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await creatorService.deleteCreator(id);

    logger.info({ creatorId: id, userId: req.user?.id }, 'Creator profile deleted');

    res.status(204).send();
  })
);

/**
 * GET /creators
 * List creators with filters
 */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      status,
      verificationStatus,
      primaryNiche,
      country,
      minReputationScore,
      search,
      page,
      limit,
    } = req.query;

    const result = await creatorService.listCreators({
      status: status as any,
      verificationStatus: verificationStatus as any,
      primaryNiche: primaryNiche as string,
      country: country as string,
      minReputationScore: minReputationScore ? Number(minReputationScore) : undefined,
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      status: 'success',
      ...result,
    });
  })
);

/**
 * GET /creators/user/:userId
 * Get creator profile by user ID
 */
router.get(
  '/user/:userId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const creator = await creatorService.getCreatorByUserId(userId);

    res.json({
      status: 'success',
      data: { creator },
    });
  })
);

// Portfolio Routes
/**
 * GET /creators/:id/portfolio
 * Get creator's portfolio
 */
router.get(
  '/:id/portfolio',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const portfolio = await creatorService.getPortfolio(id);

    res.json({
      status: 'success',
      data: { portfolio },
    });
  })
);

/**
 * POST /creators/:id/portfolio
 * Add portfolio item
 */
router.post(
  '/:id/portfolio',
  authenticate,
  requireSelfOrAdmin,
  validate(portfolioItemSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const portfolioItem = await creatorService.addPortfolioItem(id, req.body);

    logger.info(
      { creatorId: id, portfolioItemId: portfolioItem.id },
      'Portfolio item added'
    );

    res.status(201).json({
      status: 'success',
      data: { portfolioItem },
    });
  })
);

/**
 * PUT /creators/:id/portfolio/:itemId
 * Update portfolio item
 */
router.put(
  '/:id/portfolio/:itemId',
  authenticate,
  requireSelfOrAdmin,
  validate(portfolioItemSchema),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const portfolioItem = await creatorService.updatePortfolioItem(itemId, req.body);

    res.json({
      status: 'success',
      data: { portfolioItem },
    });
  })
);

/**
 * DELETE /creators/:id/portfolio/:itemId
 * Delete portfolio item
 */
router.delete(
  '/:id/portfolio/:itemId',
  authenticate,
  requireSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    await creatorService.deletePortfolioItem(itemId);

    res.status(204).send();
  })
);

// Metrics Routes
/**
 * GET /creators/:id/metrics
 * Get creator metrics
 */
router.get(
  '/:id/metrics',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const metrics = await creatorService.getMetrics(id);

    res.json({
      status: 'success',
      data: { metrics },
    });
  })
);

/**
 * PUT /creators/:id/metrics
 * Update creator metrics (admin or system only)
 */
router.put(
  '/:id/metrics',
  authenticate,
  requireRole('admin', 'system'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const metrics = await creatorService.updateMetrics(id, req.body);

    res.json({
      status: 'success',
      data: { metrics },
    });
  })
);

// Earnings Routes
/**
 * GET /creators/:id/earnings
 * Get creator earnings
 */
router.get(
  '/:id/earnings',
  authenticate,
  requireSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const earnings = await creatorService.getEarnings(id);

    res.json({
      status: 'success',
      data: { earnings },
    });
  })
);

/**
 * POST /creators/:id/payout
 * Request payout
 */
router.post(
  '/:id/payout',
  authenticate,
  requireSelfOrAdmin,
  validate(payoutRequestSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    const payout = await creatorService.requestPayout(id, amount);

    logger.info(
      { creatorId: id, payoutId: payout.id, amount },
      'Payout requested'
    );

    res.status(201).json({
      status: 'success',
      data: { payout },
    });
  })
);

/**
 * GET /creators/:id/payouts
 * Get payout history
 */
router.get(
  '/:id/payouts',
  authenticate,
  requireSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payouts = await creatorService.getPayouts(id);

    res.json({
      status: 'success',
      data: { payouts },
    });
  })
);

// Verification Routes
/**
 * GET /creators/:id/verification
 * Get verification status
 */
router.get(
  '/:id/verification',
  authenticate,
  requireSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const verification = await creatorService.getVerificationStatus(id);

    res.json({
      status: 'success',
      data: { verification },
    });
  })
);

/**
 * POST /creators/:id/verify
 * Verify creator (admin only)
 */
router.post(
  '/:id/verify',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const creator = await creatorService.verifyCreator(id, req.user!.id);

    logger.info(
      { creatorId: id, verifiedBy: req.user!.id },
      'Creator verified'
    );

    res.json({
      status: 'success',
      data: { creator },
    });
  })
);

/**
 * PUT /creators/:id/verification
 * Update verification details
 */
router.put(
  '/:id/verification',
  authenticate,
  requireSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const verification = await creatorService.updateVerification(id, req.body);

    res.json({
      status: 'success',
      data: { verification },
    });
  })
);

// Review Routes
/**
 * GET /creators/:id/reviews
 * Get creator reviews
 */
router.get(
  '/:id/reviews',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reviews = await creatorService.getReviews(id);

    res.json({
      status: 'success',
      data: { reviews },
    });
  })
);

/**
 * POST /creators/:id/reviews/:reviewId/respond
 * Respond to a review
 */
router.post(
  '/:id/reviews/:reviewId/respond',
  authenticate,
  requireSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { response } = req.body;

    const review = await creatorService.respondToReview(reviewId, response);

    res.json({
      status: 'success',
      data: { review },
    });
  })
);

/**
 * POST /creators/:id/calculate-reputation
 * Recalculate reputation score
 */
router.post(
  '/:id/calculate-reputation',
  authenticate,
  requireRole('admin', 'system'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const score = await creatorService.calculateReputationScore(id);

    res.json({
      status: 'success',
      data: { reputationScore: score },
    });
  })
);

// Matching Routes
/**
 * GET /creators/match
 * Find matching creators based on criteria
 */
router.get(
  '/match',
  authenticate,
  validate(matchingSchema),
  asyncHandler(async (req, res) => {
    const {
      niche,
      niches,
      minFollowers,
      maxFollowers,
      minEngagementRate,
      location,
      country,
      platforms,
      minReputationScore,
      budget,
      languages,
      limit,
    } = req.query as any;

    const criteria = {
      niche,
      niches: niches ? niches.split(',') : [],
      minFollowers,
      maxFollowers,
      minEngagementRate,
      location,
      country,
      platforms: platforms ? platforms.split(',') : [],
      minReputationScore,
      budget,
      languages: languages ? languages.split(',') : [],
      limit,
    };

    const creators = await matchingService.findMatchingCreators(criteria);

    res.json({
      status: 'success',
      data: { creators },
      count: creators.length,
    });
  })
);

/**
 * GET /creators/recommend
 * Get recommended creators with scores
 */
router.get(
  '/recommend',
  authenticate,
  validate(matchingSchema),
  asyncHandler(async (req, res) => {
    const {
      niche,
      niches,
      minFollowers,
      maxFollowers,
      minEngagementRate,
      location,
      country,
      platforms,
      minReputationScore,
      budget,
      languages,
      limit,
    } = req.query as any;

    const { minScore, includeScores } = req.query as any;

    const criteria = {
      niche,
      niches: niches ? niches.split(',') : [],
      minFollowers,
      maxFollowers,
      minEngagementRate,
      location,
      country,
      platforms: platforms ? platforms.split(',') : [],
      minReputationScore,
      budget,
      languages: languages ? languages.split(',') : [],
      limit,
    };

    const recommendations = await matchingService.getRecommendedCreators(
      criteria,
      {
        minScore: minScore ? Number(minScore) : undefined,
        includeScores: includeScores === 'true',
      }
    );

    res.json({
      status: 'success',
      data: { recommendations },
      count: recommendations.length,
    });
  })
);

/**
 * GET /creators/:id/similar
 * Find similar creators
 */
router.get(
  '/:id/similar',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit } = req.query;

    const similar = await matchingService.findSimilarCreators(
      id,
      limit ? Number(limit) : undefined
    );

    res.json({
      status: 'success',
      data: { creators: similar },
      count: similar.length,
    });
  })
);

/**
 * GET /creators/:id/compatibility/:brandId
 * Analyze compatibility with a brand
 */
router.get(
  '/:id/compatibility/:brandId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id, brandId } = req.params;
    const compatibility = await matchingService.analyzeCompatibility(id, brandId);

    res.json({
      status: 'success',
      data: { compatibility },
    });
  })
);

/**
 * GET /creators/trending/:niche
 * Get trending creators in a niche
 */
router.get(
  '/trending/:niche',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { niche } = req.params;
    const { limit } = req.query;

    const trending = await matchingService.getTrendingCreators(
      niche,
      limit ? Number(limit) : undefined
    );

    res.json({
      status: 'success',
      data: { creators: trending },
      count: trending.length,
    });
  })
);

export default router;
