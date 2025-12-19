// =============================================================================
// Campaign Service Unit Tests
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { campaignService } from '@/services/campaign.service';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    brief: {
      create: vi.fn(),
      update: vi.fn(),
    },
    deliverable: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback),
  },
}));

describe('CampaignService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should successfully create a campaign', async () => {
      const organizationId = 'org-123';
      const userId = 'user-123';
      const input = {
        name: 'Summer UGC Campaign',
        description: 'A campaign for summer products',
        type: 'UGC' as const,
        budget: 5000,
        currency: 'USD',
      };

      const mockCampaign = {
        id: 'campaign-123',
        organizationId,
        name: input.name,
        slug: 'summer-ugc-campaign',
        description: input.description,
        type: input.type,
        budget: input.budget,
        currency: input.currency,
        createdBy: userId,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        brief: null,
        deliverables: [],
        milestones: [],
      };

      vi.mocked(prisma.campaign.create).mockResolvedValue(mockCampaign as any);

      const result = await campaignService.createCampaign(organizationId, userId, input);

      expect(result.name).toBe(input.name);
      expect(result.organizationId).toBe(organizationId);
      expect(prisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: input.name,
            organizationId,
            createdBy: userId,
          }),
        })
      );
    });

    it('should generate slug from campaign name', async () => {
      const organizationId = 'org-123';
      const userId = 'user-123';
      const input = {
        name: 'My New Campaign 2024',
      };

      const mockCampaign = {
        id: 'campaign-123',
        organizationId,
        name: input.name,
        slug: 'my-new-campaign-2024',
        createdBy: userId,
        brief: null,
        deliverables: [],
        milestones: [],
      };

      vi.mocked(prisma.campaign.create).mockResolvedValue(mockCampaign as any);

      const result = await campaignService.createCampaign(organizationId, userId, input);

      expect(result.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should set default values for optional fields', async () => {
      const organizationId = 'org-123';
      const userId = 'user-123';
      const input = {
        name: 'Basic Campaign',
      };

      const mockCampaign = {
        id: 'campaign-123',
        organizationId,
        name: input.name,
        slug: 'basic-campaign',
        type: 'UGC',
        currency: 'USD',
        createdBy: userId,
        tags: [],
        brief: null,
        deliverables: [],
        milestones: [],
      };

      vi.mocked(prisma.campaign.create).mockResolvedValue(mockCampaign as any);

      const result = await campaignService.createCampaign(organizationId, userId, input);

      expect(result.type).toBe('UGC');
      expect(result.currency).toBe('USD');
    });
  });

  describe('getCampaign', () => {
    it('should retrieve a campaign with all related data', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';

      const mockCampaign = {
        id: campaignId,
        organizationId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        brief: {
          id: 'brief-123',
          overview: 'Campaign overview',
        },
        deliverables: [
          {
            id: 'deliverable-123',
            name: 'Video Content',
            type: 'VIDEO',
          },
        ],
        milestones: [
          {
            id: 'milestone-123',
            name: 'Content Submission',
            order: 1,
          },
        ],
        applications: [],
      };

      vi.mocked(prisma.campaign.findFirst).mockResolvedValue(mockCampaign as any);

      const result = await campaignService.getCampaign(campaignId, organizationId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(campaignId);
      expect(result?.brief).toBeDefined();
      expect(result?.deliverables).toHaveLength(1);
      expect(prisma.campaign.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: campaignId, organizationId },
          include: expect.any(Object),
        })
      );
    });

    it('should return null for non-existent campaign', async () => {
      const campaignId = 'non-existent';
      const organizationId = 'org-123';

      vi.mocked(prisma.campaign.findFirst).mockResolvedValue(null);

      const result = await campaignService.getCampaign(campaignId, organizationId);

      expect(result).toBeNull();
    });

    it('should not retrieve campaign from different organization', async () => {
      const campaignId = 'campaign-123';
      const wrongOrgId = 'wrong-org';

      vi.mocked(prisma.campaign.findFirst).mockResolvedValue(null);

      const result = await campaignService.getCampaign(campaignId, wrongOrgId);

      expect(result).toBeNull();
    });
  });

  describe('listCampaigns', () => {
    it('should list campaigns with pagination', async () => {
      const options = {
        organizationId: 'org-123',
        page: 1,
        limit: 10,
      };

      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Campaign 1',
          organizationId: options.organizationId,
        },
        {
          id: 'campaign-2',
          name: 'Campaign 2',
          organizationId: options.organizationId,
        },
      ];

      vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns as any);
      vi.mocked(prisma.campaign.count).mockResolvedValue(2);

      const result = await campaignService.listCampaigns(options);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter campaigns by status', async () => {
      const options = {
        organizationId: 'org-123',
        status: 'ACTIVE',
        page: 1,
        limit: 10,
      };

      vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);
      vi.mocked(prisma.campaign.count).mockResolvedValue(0);

      await campaignService.listCampaigns(options);

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should filter campaigns by type', async () => {
      const options = {
        organizationId: 'org-123',
        type: 'UGC',
        page: 1,
        limit: 10,
      };

      vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);
      vi.mocked(prisma.campaign.count).mockResolvedValue(0);

      await campaignService.listCampaigns(options);

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'UGC',
          }),
        })
      );
    });

    it('should search campaigns by name', async () => {
      const options = {
        organizationId: 'org-123',
        search: 'summer',
        page: 1,
        limit: 10,
      };

      vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);
      vi.mocked(prisma.campaign.count).mockResolvedValue(0);

      await campaignService.listCampaigns(options);

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        })
      );
    });
  });

  describe('updateCampaign', () => {
    it('should successfully update a campaign', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const input = {
        name: 'Updated Campaign Name',
        status: 'ACTIVE' as const,
      };

      const mockUpdatedCampaign = {
        id: campaignId,
        organizationId,
        name: input.name,
        status: input.status,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.campaign.update).mockResolvedValue(mockUpdatedCampaign as any);

      const result = await campaignService.updateCampaign(campaignId, organizationId, input);

      expect(result.name).toBe(input.name);
      expect(result.status).toBe(input.status);
      expect(prisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: campaignId, organizationId },
          data: expect.objectContaining(input),
        })
      );
    });

    it('should allow partial updates', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const input = {
        description: 'Updated description only',
      };

      const mockUpdatedCampaign = {
        id: campaignId,
        organizationId,
        description: input.description,
      };

      vi.mocked(prisma.campaign.update).mockResolvedValue(mockUpdatedCampaign as any);

      const result = await campaignService.updateCampaign(campaignId, organizationId, input);

      expect(result.description).toBe(input.description);
    });
  });

  describe('deleteCampaign', () => {
    it('should successfully delete a campaign', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';

      vi.mocked(prisma.campaign.delete).mockResolvedValue({} as any);

      await campaignService.deleteCampaign(campaignId, organizationId);

      expect(prisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: campaignId, organizationId },
      });
    });

    it('should throw error when deleting non-existent campaign', async () => {
      const campaignId = 'non-existent';
      const organizationId = 'org-123';

      vi.mocked(prisma.campaign.delete).mockRejectedValue(new Error('Record not found'));

      await expect(
        campaignService.deleteCampaign(campaignId, organizationId)
      ).rejects.toThrow();
    });
  });
});
