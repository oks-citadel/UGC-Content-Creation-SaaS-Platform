import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { Prisma } from '@prisma/client';

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type?: 'UGC' | 'INFLUENCER' | 'AFFILIATE' | 'AMBASSADOR' | 'PRODUCT_SEEDING';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  currency?: string;
  targetAudience?: Record<string, unknown>;
  goals?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
}

export interface CreateBriefInput {
  overview?: string;
  objectives?: Record<string, unknown>;
  targetPlatforms?: string[];
  contentTypes?: string[];
  brandGuidelines?: Record<string, unknown>;
  doAndDonts?: Record<string, unknown>;
  keyMessages?: string[];
  hashtags?: string[];
  mentions?: string[];
  references?: Record<string, unknown>;
}

export interface CreateDeliverableInput {
  name: string;
  description?: string;
  type: 'VIDEO' | 'IMAGE' | 'STORY' | 'REEL' | 'TIKTOK' | 'BLOG_POST' | 'REVIEW' | 'TESTIMONIAL' | 'OTHER';
  platform?: string;
  quantity?: number;
  requirements?: Record<string, unknown>;
  dueDate?: Date;
  compensation?: number;
}

export interface ListCampaignsOptions {
  organizationId: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class CampaignService {
  async createCampaign(organizationId: string, userId: string, input: CreateCampaignInput) {
    const slug = this.generateSlug(input.name);

    const campaign = await prisma.campaign.create({
      data: {
        organizationId,
        name: input.name,
        slug,
        description: input.description,
        type: input.type || 'UGC',
        startDate: input.startDate,
        endDate: input.endDate,
        budget: input.budget ? new Prisma.Decimal(input.budget) : null,
        currency: input.currency || 'USD',
        targetAudience: input.targetAudience as Prisma.InputJsonValue,
        goals: input.goals as Prisma.InputJsonValue,
        tags: input.tags || [],
        createdBy: userId,
      },
      include: {
        brief: true,
        deliverables: true,
        milestones: true,
      },
    });

    return campaign;
  }

  async getCampaign(campaignId: string, organizationId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        brief: true,
        deliverables: true,
        milestones: {
          orderBy: { order: 'asc' },
        },
        applications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        content: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            applications: true,
            content: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    return campaign;
  }

  async listCampaigns(options: ListCampaignsOptions) {
    const {
      organizationId,
      status,
      type,
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.CampaignWhereInput = {
      organizationId,
      ...(status && { status: status as Prisma.EnumCampaignStatusFilter }),
      ...(type && { type: type as Prisma.EnumCampaignTypeFilter }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          _count: {
            select: {
              applications: true,
              content: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCampaign(campaignId: string, organizationId: string, input: UpdateCampaignInput) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const updateData: Prisma.CampaignUpdateInput = {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type && { type: input.type }),
      ...(input.status && { status: input.status }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.budget !== undefined && { budget: input.budget ? new Prisma.Decimal(input.budget) : null }),
      ...(input.currency && { currency: input.currency }),
      ...(input.targetAudience && { targetAudience: input.targetAudience as Prisma.InputJsonValue }),
      ...(input.goals && { goals: input.goals as Prisma.InputJsonValue }),
      ...(input.tags && { tags: input.tags }),
    };

    return prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
      include: {
        brief: true,
        deliverables: true,
      },
    });
  }

  async deleteCampaign(campaignId: string, organizationId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.status === 'ACTIVE') {
      throw new AppError('Cannot delete an active campaign', 400);
    }

    await prisma.campaign.delete({
      where: { id: campaignId },
    });
  }

  // Brief methods
  async createOrUpdateBrief(campaignId: string, organizationId: string, input: CreateBriefInput) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    return prisma.campaignBrief.upsert({
      where: { campaignId },
      update: {
        overview: input.overview,
        objectives: input.objectives as Prisma.InputJsonValue,
        targetPlatforms: input.targetPlatforms || [],
        contentTypes: input.contentTypes || [],
        brandGuidelines: input.brandGuidelines as Prisma.InputJsonValue,
        doAndDonts: input.doAndDonts as Prisma.InputJsonValue,
        keyMessages: input.keyMessages || [],
        hashtags: input.hashtags || [],
        mentions: input.mentions || [],
        references: input.references as Prisma.InputJsonValue,
      },
      create: {
        campaignId,
        overview: input.overview,
        objectives: input.objectives as Prisma.InputJsonValue,
        targetPlatforms: input.targetPlatforms || [],
        contentTypes: input.contentTypes || [],
        brandGuidelines: input.brandGuidelines as Prisma.InputJsonValue,
        doAndDonts: input.doAndDonts as Prisma.InputJsonValue,
        keyMessages: input.keyMessages || [],
        hashtags: input.hashtags || [],
        mentions: input.mentions || [],
        references: input.references as Prisma.InputJsonValue,
      },
    });
  }

  // Deliverable methods
  async addDeliverable(campaignId: string, organizationId: string, input: CreateDeliverableInput) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    return prisma.deliverable.create({
      data: {
        campaignId,
        name: input.name,
        description: input.description,
        type: input.type,
        platform: input.platform,
        quantity: input.quantity || 1,
        requirements: input.requirements as Prisma.InputJsonValue,
        dueDate: input.dueDate,
        compensation: input.compensation ? new Prisma.Decimal(input.compensation) : null,
      },
    });
  }

  async updateDeliverable(
    deliverableId: string,
    campaignId: string,
    organizationId: string,
    input: Partial<CreateDeliverableInput>
  ) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const deliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, campaignId },
    });

    if (!deliverable) {
      throw new AppError('Deliverable not found', 404);
    }

    return prisma.deliverable.update({
      where: { id: deliverableId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.type && { type: input.type }),
        ...(input.platform !== undefined && { platform: input.platform }),
        ...(input.quantity && { quantity: input.quantity }),
        ...(input.requirements && { requirements: input.requirements as Prisma.InputJsonValue }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.compensation !== undefined && {
          compensation: input.compensation ? new Prisma.Decimal(input.compensation) : null,
        }),
      },
    });
  }

  async deleteDeliverable(deliverableId: string, campaignId: string, organizationId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const deliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, campaignId },
    });

    if (!deliverable) {
      throw new AppError('Deliverable not found', 404);
    }

    await prisma.deliverable.delete({
      where: { id: deliverableId },
    });
  }

  // Application methods
  async applyToCampaign(campaignId: string, creatorId: string, pitch?: string, proposedRate?: number) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.status !== 'ACTIVE') {
      throw new AppError('Campaign is not accepting applications', 400);
    }

    const existingApplication = await prisma.creatorApplication.findUnique({
      where: {
        campaignId_creatorId: {
          campaignId,
          creatorId,
        },
      },
    });

    if (existingApplication) {
      throw new AppError('You have already applied to this campaign', 409);
    }

    return prisma.creatorApplication.create({
      data: {
        campaignId,
        creatorId,
        pitch,
        proposedRate: proposedRate ? new Prisma.Decimal(proposedRate) : null,
      },
    });
  }

  async listApplications(campaignId: string, organizationId: string, status?: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    return prisma.creatorApplication.findMany({
      where: {
        campaignId,
        ...(status && { status: status as Prisma.EnumApplicationStatusFilter }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateApplicationStatus(
    applicationId: string,
    campaignId: string,
    organizationId: string,
    userId: string,
    status: 'UNDER_REVIEW' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED'
  ) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const application = await prisma.creatorApplication.findFirst({
      where: { id: applicationId, campaignId },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    return prisma.creatorApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });
  }

  // Milestone methods
  async addMilestone(
    campaignId: string,
    organizationId: string,
    name: string,
    description?: string,
    dueDate?: Date
  ) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const lastMilestone = await prisma.milestone.findFirst({
      where: { campaignId },
      orderBy: { order: 'desc' },
    });

    return prisma.milestone.create({
      data: {
        campaignId,
        name,
        description,
        dueDate,
        order: (lastMilestone?.order || 0) + 1,
      },
    });
  }

  async completeMilestone(milestoneId: string, campaignId: string, organizationId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, campaignId },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: { completedAt: new Date() },
    });
  }

  // Stats methods
  async getCampaignStats(organizationId: string) {
    const [total, active, completed, totalApplications, totalContent] = await Promise.all([
      prisma.campaign.count({ where: { organizationId } }),
      prisma.campaign.count({ where: { organizationId, status: 'ACTIVE' } }),
      prisma.campaign.count({ where: { organizationId, status: 'COMPLETED' } }),
      prisma.creatorApplication.count({
        where: { campaign: { organizationId } },
      }),
      prisma.content.count({
        where: { campaign: { organizationId } },
      }),
    ]);

    return {
      totalCampaigns: total,
      activeCampaigns: active,
      completedCampaigns: completed,
      totalApplications,
      totalContent,
    };
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50) +
      '-' +
      uuidv4().substring(0, 8)
    );
  }
}

export const campaignService = new CampaignService();
