import { Router, Request, Response, NextFunction } from 'express';
import opportunityService from '../services/opportunity.service';
import biddingService from '../services/bidding.service';
import contractService from '../services/contract.service';
import payoutService from '../services/payout.service';
import disputeService from '../services/dispute.service';
import ambassadorService from '../services/ambassador.service';
import { AppError } from '../middleware/error-handler';
import logger from '../utils/logger';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== OPPORTUNITIES ====================

/**
 * @route   POST /api/marketplace/opportunities
 * @desc    Create a new opportunity
 * @access  Brand
 */
router.post('/opportunities', asyncHandler(async (req: Request, res: Response) => {
  const opportunity = await opportunityService.createOpportunity(req.body);
  res.status(201).json({ success: true, data: opportunity });
}));

/**
 * @route   GET /api/marketplace/opportunities
 * @desc    List opportunities with filters
 * @access  Public/Creator/Brand
 */
router.get('/opportunities', asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as any,
    brandId: req.query.brandId as string,
    campaignId: req.query.campaignId as string,
    minBudget: req.query.minBudget ? parseFloat(req.query.minBudget as string) : undefined,
    maxBudget: req.query.maxBudget ? parseFloat(req.query.maxBudget as string) : undefined,
    niche: req.query.niche as string,
    location: req.query.location as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await opportunityService.listOpportunities(filters);
  res.json({ success: true, data: result });
}));

/**
 * @route   GET /api/marketplace/opportunities/:id
 * @desc    Get opportunity by ID
 * @access  Public
 */
router.get('/opportunities/:id', asyncHandler(async (req: Request, res: Response) => {
  const opportunity = await opportunityService.getOpportunityById(req.params.id);
  res.json({ success: true, data: opportunity });
}));

/**
 * @route   PUT /api/marketplace/opportunities/:id
 * @desc    Update opportunity
 * @access  Brand
 */
router.put('/opportunities/:id', asyncHandler(async (req: Request, res: Response) => {
  const opportunity = await opportunityService.updateOpportunity(req.params.id, req.body);
  res.json({ success: true, data: opportunity });
}));

/**
 * @route   POST /api/marketplace/opportunities/:id/close
 * @desc    Close opportunity
 * @access  Brand
 */
router.post('/opportunities/:id/close', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const opportunity = await opportunityService.closeOpportunity(req.params.id, reason);
  res.json({ success: true, data: opportunity });
}));

/**
 * @route   GET /api/marketplace/opportunities/matches/:creatorId
 * @desc    Get AI-powered opportunity matches for creator
 * @access  Creator
 */
router.get('/opportunities/matches/:creatorId', asyncHandler(async (req: Request, res: Response) => {
  const matches = await opportunityService.getOpportunityMatches(req.params.creatorId);
  res.json({ success: true, data: matches });
}));

// ==================== BIDS ====================

/**
 * @route   POST /api/marketplace/bids
 * @desc    Submit a bid
 * @access  Creator
 */
router.post('/bids', asyncHandler(async (req: Request, res: Response) => {
  const bid = await biddingService.submitBid(req.body);
  res.status(201).json({ success: true, data: bid });
}));

/**
 * @route   GET /api/marketplace/bids/creator/:creatorId
 * @desc    Get creator's bids
 * @access  Creator
 */
router.get('/bids/creator/:creatorId', asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as any,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await biddingService.getCreatorBids(req.params.creatorId, filters);
  res.json({ success: true, data: result });
}));

/**
 * @route   GET /api/marketplace/opportunities/:id/bids
 * @desc    Get bids for an opportunity
 * @access  Brand
 */
router.get('/opportunities/:id/bids', asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.query;
  if (!brandId) {
    throw new AppError(400, 'brandId is required');
  }

  const filters = {
    status: req.query.status as any,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await biddingService.getBidsForOpportunity(
    req.params.id,
    brandId as string,
    filters
  );
  res.json({ success: true, data: result });
}));

/**
 * @route   PUT /api/marketplace/bids/:id
 * @desc    Update a bid
 * @access  Creator
 */
router.put('/bids/:id', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId, ...updateData } = req.body;
  const bid = await biddingService.updateBid(req.params.id, creatorId, updateData);
  res.json({ success: true, data: bid });
}));

/**
 * @route   POST /api/marketplace/bids/:id/withdraw
 * @desc    Withdraw a bid
 * @access  Creator
 */
router.post('/bids/:id/withdraw', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.body;
  const bid = await biddingService.withdrawBid(req.params.id, creatorId);
  res.json({ success: true, data: bid });
}));

/**
 * @route   POST /api/marketplace/bids/:id/accept
 * @desc    Accept a bid
 * @access  Brand
 */
router.post('/bids/:id/accept', asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.body;
  const bid = await biddingService.acceptBid(req.params.id, brandId);
  res.json({ success: true, data: bid });
}));

/**
 * @route   POST /api/marketplace/bids/:id/reject
 * @desc    Reject a bid
 * @access  Brand
 */
router.post('/bids/:id/reject', asyncHandler(async (req: Request, res: Response) => {
  const { brandId, reason } = req.body;
  const bid = await biddingService.rejectBid(req.params.id, brandId, reason);
  res.json({ success: true, data: bid });
}));

/**
 * @route   POST /api/marketplace/bids/:id/negotiate
 * @desc    Negotiate a bid (counter offer)
 * @access  Brand/Creator
 */
router.post('/bids/:id/negotiate', asyncHandler(async (req: Request, res: Response) => {
  const { counterOffer, counterOfferedBy } = req.body;
  const bid = await biddingService.negotiateBid(req.params.id, { counterOffer, counterOfferedBy });
  res.json({ success: true, data: bid });
}));

// ==================== CONTRACTS ====================

/**
 * @route   POST /api/marketplace/contracts
 * @desc    Generate a contract
 * @access  Brand
 */
router.post('/contracts', asyncHandler(async (req: Request, res: Response) => {
  const contract = await contractService.generateContract(req.body);
  res.status(201).json({ success: true, data: contract });
}));

/**
 * @route   GET /api/marketplace/contracts/:id
 * @desc    Get contract by ID
 * @access  Brand/Creator
 */
router.get('/contracts/:id', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) {
    throw new AppError(400, 'userId is required');
  }

  const contract = await contractService.getContractById(req.params.id, userId as string);
  res.json({ success: true, data: contract });
}));

/**
 * @route   GET /api/marketplace/contracts
 * @desc    List contracts
 * @access  Brand/Creator
 */
router.get('/contracts', asyncHandler(async (req: Request, res: Response) => {
  const { userId, userRole } = req.query;
  if (!userId || !userRole) {
    throw new AppError(400, 'userId and userRole are required');
  }

  const filters = {
    status: req.query.status as any,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await contractService.listContracts(
    userId as string,
    userRole as 'creator' | 'brand',
    filters
  );
  res.json({ success: true, data: result });
}));

/**
 * @route   POST /api/marketplace/contracts/:id/send-for-signature
 * @desc    Send contract for signature
 * @access  Brand
 */
router.post('/contracts/:id/send-for-signature', asyncHandler(async (req: Request, res: Response) => {
  const { senderId } = req.body;
  const contract = await contractService.sendForSignature(req.params.id, senderId);
  res.json({ success: true, data: contract });
}));

/**
 * @route   POST /api/marketplace/contracts/:id/sign
 * @desc    Sign a contract
 * @access  Brand/Creator
 */
router.post('/contracts/:id/sign', asyncHandler(async (req: Request, res: Response) => {
  const { signerId, role } = req.body;
  const contract = await contractService.signContract(req.params.id, signerId, role);
  res.json({ success: true, data: contract });
}));

/**
 * @route   GET /api/marketplace/contracts/:id/status
 * @desc    Get contract status
 * @access  Brand/Creator
 */
router.get('/contracts/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const status = await contractService.getContractStatus(req.params.id);
  res.json({ success: true, data: status });
}));

/**
 * @route   POST /api/marketplace/contracts/:id/terminate
 * @desc    Terminate a contract
 * @access  Brand/Creator
 */
router.post('/contracts/:id/terminate', asyncHandler(async (req: Request, res: Response) => {
  const { terminatedBy, reason } = req.body;
  const contract = await contractService.terminateContract(req.params.id, terminatedBy, reason);
  res.json({ success: true, data: contract });
}));

/**
 * @route   POST /api/marketplace/contracts/:id/complete
 * @desc    Complete a contract
 * @access  Brand
 */
router.post('/contracts/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const contract = await contractService.completeContract(req.params.id);
  res.json({ success: true, data: contract });
}));

// ==================== PAYOUTS ====================

/**
 * @route   POST /api/marketplace/payouts
 * @desc    Request a payout
 * @access  Creator
 */
router.post('/payouts', asyncHandler(async (req: Request, res: Response) => {
  const payout = await payoutService.requestPayout(req.body);
  res.status(201).json({ success: true, data: payout });
}));

/**
 * @route   GET /api/marketplace/payouts/:creatorId
 * @desc    Get payout history
 * @access  Creator
 */
router.get('/payouts/:creatorId', asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as any,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await payoutService.getPayoutHistory(req.params.creatorId, filters);
  res.json({ success: true, data: result });
}));

/**
 * @route   POST /api/marketplace/payouts/:id/cancel
 * @desc    Cancel a pending payout
 * @access  Creator
 */
router.post('/payouts/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.body;
  const payout = await payoutService.cancelPayout(req.params.id, creatorId);
  res.json({ success: true, data: payout });
}));

/**
 * @route   POST /api/marketplace/payout-methods
 * @desc    Add payout method
 * @access  Creator
 */
router.post('/payout-methods', asyncHandler(async (req: Request, res: Response) => {
  const payoutMethod = await payoutService.addPayoutMethod(req.body);
  res.status(201).json({ success: true, data: payoutMethod });
}));

/**
 * @route   GET /api/marketplace/payout-methods/:creatorId
 * @desc    Get payout methods
 * @access  Creator
 */
router.get('/payout-methods/:creatorId', asyncHandler(async (req: Request, res: Response) => {
  const methods = await payoutService.getPayoutMethods(req.params.creatorId);
  res.json({ success: true, data: methods });
}));

/**
 * @route   POST /api/marketplace/payout-methods/:id/verify
 * @desc    Verify payout method
 * @access  Creator
 */
router.post('/payout-methods/:id/verify', asyncHandler(async (req: Request, res: Response) => {
  const method = await payoutService.verifyPayoutMethod(req.params.id);
  res.json({ success: true, data: method });
}));

// ==================== DISPUTES ====================

/**
 * @route   POST /api/marketplace/disputes
 * @desc    Raise a dispute
 * @access  Brand/Creator
 */
router.post('/disputes', asyncHandler(async (req: Request, res: Response) => {
  const dispute = await disputeService.raiseDispute(req.body);
  res.status(201).json({ success: true, data: dispute });
}));

/**
 * @route   GET /api/marketplace/disputes/:id
 * @desc    Get dispute by ID
 * @access  Brand/Creator/Admin
 */
router.get('/disputes/:id', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) {
    throw new AppError(400, 'userId is required');
  }

  const dispute = await disputeService.getDisputeById(req.params.id, userId as string);
  res.json({ success: true, data: dispute });
}));

/**
 * @route   GET /api/marketplace/disputes
 * @desc    List disputes
 * @access  Brand/Creator/Admin
 */
router.get('/disputes', asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    userId: req.query.userId as string,
    userRole: req.query.userRole as any,
    status: req.query.status as any,
    priority: req.query.priority as any,
    contractId: req.query.contractId as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await disputeService.listDisputes(filters);
  res.json({ success: true, data: result });
}));

/**
 * @route   POST /api/marketplace/disputes/:id/respond
 * @desc    Respond to a dispute
 * @access  Brand/Creator/Admin
 */
router.post('/disputes/:id/respond', asyncHandler(async (req: Request, res: Response) => {
  const message = await disputeService.respondToDispute(req.params.id, req.body);
  res.status(201).json({ success: true, data: message });
}));

/**
 * @route   POST /api/marketplace/disputes/:id/escalate
 * @desc    Escalate a dispute
 * @access  Brand/Creator
 */
router.post('/disputes/:id/escalate', asyncHandler(async (req: Request, res: Response) => {
  const { escalatedBy } = req.body;
  const dispute = await disputeService.escalateDispute(req.params.id, escalatedBy);
  res.json({ success: true, data: dispute });
}));

/**
 * @route   POST /api/marketplace/disputes/:id/resolve
 * @desc    Resolve a dispute
 * @access  Admin
 */
router.post('/disputes/:id/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { resolvedBy, resolution } = req.body;
  const dispute = await disputeService.resolveDispute(req.params.id, { resolvedBy, resolution });
  res.json({ success: true, data: dispute });
}));

/**
 * @route   POST /api/marketplace/disputes/:id/close
 * @desc    Close a dispute
 * @access  Admin
 */
router.post('/disputes/:id/close', asyncHandler(async (req: Request, res: Response) => {
  const { closedBy } = req.body;
  const dispute = await disputeService.closeDispute(req.params.id, closedBy);
  res.json({ success: true, data: dispute });
}));

// ==================== AMBASSADOR PROGRAMS ====================

/**
 * @route   POST /api/marketplace/ambassador-programs
 * @desc    Create ambassador program
 * @access  Brand
 */
router.post('/ambassador-programs', asyncHandler(async (req: Request, res: Response) => {
  const program = await ambassadorService.createProgram(req.body);
  res.status(201).json({ success: true, data: program });
}));

/**
 * @route   GET /api/marketplace/ambassador-programs
 * @desc    List ambassador programs
 * @access  Public/Brand
 */
router.get('/ambassador-programs', asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    brandId: req.query.brandId as string,
    isActive: req.query.isActive === 'true',
    isPublic: req.query.isPublic === 'true',
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await ambassadorService.listPrograms(filters);
  res.json({ success: true, data: result });
}));

/**
 * @route   GET /api/marketplace/ambassador-programs/:id
 * @desc    Get ambassador program by ID
 * @access  Public/Brand
 */
router.get('/ambassador-programs/:id', asyncHandler(async (req: Request, res: Response) => {
  const program = await ambassadorService.getProgramById(req.params.id);
  res.json({ success: true, data: program });
}));

/**
 * @route   PUT /api/marketplace/ambassador-programs/:id
 * @desc    Update ambassador program
 * @access  Brand
 */
router.put('/ambassador-programs/:id', asyncHandler(async (req: Request, res: Response) => {
  const { brandId, ...updateData } = req.body;
  const program = await ambassadorService.updateProgram(req.params.id, brandId, updateData);
  res.json({ success: true, data: program });
}));

/**
 * @route   POST /api/marketplace/ambassador-programs/:id/invite
 * @desc    Invite creator to ambassador program
 * @access  Brand
 */
router.post('/ambassador-programs/:id/invite', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId, tier } = req.body;
  const ambassador = await ambassadorService.inviteAmbassador({
    programId: req.params.id,
    creatorId,
    tier,
  });
  res.status(201).json({ success: true, data: ambassador });
}));

/**
 * @route   GET /api/marketplace/ambassador-programs/:id/ambassadors
 * @desc    List program ambassadors
 * @access  Brand
 */
router.get('/ambassador-programs/:id/ambassadors', asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as any,
    tier: req.query.tier as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await ambassadorService.listProgramAmbassadors(req.params.id, filters);
  res.json({ success: true, data: result });
}));

/**
 * @route   POST /api/marketplace/ambassadors/:id/accept
 * @desc    Accept ambassador invitation
 * @access  Creator
 */
router.post('/ambassadors/:id/accept', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.body;
  const ambassador = await ambassadorService.acceptInvitation(req.params.id, creatorId);
  res.json({ success: true, data: ambassador });
}));

/**
 * @route   POST /api/marketplace/ambassadors/:id/decline
 * @desc    Decline ambassador invitation
 * @access  Creator
 */
router.post('/ambassadors/:id/decline', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.body;
  const ambassador = await ambassadorService.declineInvitation(req.params.id, creatorId);
  res.json({ success: true, data: ambassador });
}));

/**
 * @route   POST /api/marketplace/ambassadors/:id/track-performance
 * @desc    Track ambassador performance
 * @access  System/Brand
 */
router.post('/ambassadors/:id/track-performance', asyncHandler(async (req: Request, res: Response) => {
  const { metrics } = req.body;
  const ambassador = await ambassadorService.trackPerformance({
    ambassadorId: req.params.id,
    metrics,
  });
  res.json({ success: true, data: ambassador });
}));

/**
 * @route   POST /api/marketplace/ambassadors/:id/upgrade-tier
 * @desc    Upgrade ambassador tier
 * @access  Brand
 */
router.post('/ambassadors/:id/upgrade-tier', asyncHandler(async (req: Request, res: Response) => {
  const { newTier, upgradedBy } = req.body;
  const ambassador = await ambassadorService.upgradeTier(req.params.id, newTier, upgradedBy);
  res.json({ success: true, data: ambassador });
}));

/**
 * @route   POST /api/marketplace/ambassadors/:id/terminate
 * @desc    Terminate ambassador
 * @access  Brand
 */
router.post('/ambassadors/:id/terminate', asyncHandler(async (req: Request, res: Response) => {
  const { terminatedBy } = req.body;
  const ambassador = await ambassadorService.terminateAmbassador(req.params.id, terminatedBy);
  res.json({ success: true, data: ambassador });
}));

export default router;
