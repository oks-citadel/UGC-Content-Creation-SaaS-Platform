import { PrismaClient, AmbassadorProgram, Ambassador, AmbassadorStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface CreateProgramInput {
  brandId: string;
  name: string;
  description: string;
  tiers: any[];
  benefits: any;
  requirements: any;
  commissionRate?: number;
  paymentSchedule?: string;
  isPublic?: boolean;
  maxAmbassadors?: number;
}

interface UpdateProgramInput {
  name?: string;
  description?: string;
  tiers?: any[];
  benefits?: any;
  requirements?: any;
  commissionRate?: number;
  paymentSchedule?: string;
  isActive?: boolean;
  isPublic?: boolean;
  maxAmbassadors?: number;
}

interface InviteAmbassadorInput {
  programId: string;
  creatorId: string;
  tier: string;
}

interface TrackPerformanceInput {
  ambassadorId: string;
  metrics: any;
}

export class AmbassadorService {
  /**
   * Create an ambassador program
   */
  async createProgram(input: CreateProgramInput): Promise<AmbassadorProgram> {
    try {
      const program = await prisma.ambassadorProgram.create({
        data: {
          brandId: input.brandId,
          name: input.name,
          description: input.description,
          tiers: input.tiers,
          benefits: input.benefits,
          requirements: input.requirements,
          commissionRate: input.commissionRate,
          paymentSchedule: input.paymentSchedule,
          isPublic: input.isPublic || false,
          maxAmbassadors: input.maxAmbassadors,
          isActive: true,
        },
      });

      logger.info(`Ambassador program created: ${program.id} by brand ${input.brandId}`);
      return program;
    } catch (error) {
      logger.error('Error creating ambassador program:', error);
      throw error;
    }
  }

  /**
   * Update an ambassador program
   */
  async updateProgram(
    programId: string,
    brandId: string,
    input: UpdateProgramInput
  ): Promise<AmbassadorProgram> {
    try {
      // Verify ownership
      const program = await prisma.ambassadorProgram.findUnique({
        where: { id: programId },
      });

      if (!program) {
        throw new AppError(404, 'Ambassador program not found');
      }

      if (program.brandId !== brandId) {
        throw new AppError(403, 'Access denied');
      }

      const updatedProgram = await prisma.ambassadorProgram.update({
        where: { id: programId },
        data: input,
      });

      logger.info(`Ambassador program updated: ${programId}`);
      return updatedProgram;
    } catch (error) {
      logger.error('Error updating ambassador program:', error);
      throw error;
    }
  }

  /**
   * Get ambassador program by ID
   */
  async getProgramById(programId: string): Promise<any> {
    const program = await prisma.ambassadorProgram.findUnique({
      where: { id: programId },
      include: {
        ambassadors: {
          where: { status: AmbassadorStatus.ACTIVE },
        },
        _count: {
          select: { ambassadors: true },
        },
      },
    });

    if (!program) {
      throw new AppError(404, 'Ambassador program not found');
    }

    return program;
  }

  /**
   * List ambassador programs
   */
  async listPrograms(
    filters?: {
      brandId?: string;
      isActive?: boolean;
      isPublic?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    programs: AmbassadorProgram[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    const [programs, total] = await Promise.all([
      prisma.ambassadorProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { ambassadors: true },
          },
        },
      }),
      prisma.ambassadorProgram.count({ where }),
    ]);

    return {
      programs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Invite a creator to become an ambassador
   */
  async inviteAmbassador(input: InviteAmbassadorInput): Promise<Ambassador> {
    try {
      // Validate program exists and has capacity
      const program = await prisma.ambassadorProgram.findUnique({
        where: { id: input.programId },
        include: {
          _count: {
            select: { ambassadors: true },
          },
        },
      });

      if (!program) {
        throw new AppError(404, 'Ambassador program not found');
      }

      if (!program.isActive) {
        throw new AppError(400, 'Ambassador program is not active');
      }

      if (program.maxAmbassadors && program.currentCount >= program.maxAmbassadors) {
        throw new AppError(400, 'Ambassador program has reached maximum capacity');
      }

      // Check if creator is already in the program
      const existingAmbassador = await prisma.ambassador.findUnique({
        where: {
          programId_creatorId: {
            programId: input.programId,
            creatorId: input.creatorId,
          },
        },
      });

      if (existingAmbassador && existingAmbassador.status !== AmbassadorStatus.DECLINED) {
        throw new AppError(400, 'Creator is already part of this program');
      }

      // Create ambassador invitation
      const ambassador = await prisma.ambassador.create({
        data: {
          programId: input.programId,
          creatorId: input.creatorId,
          tier: input.tier,
          status: AmbassadorStatus.INVITED,
        },
      });

      logger.info(`Ambassador invited: Creator ${input.creatorId} to program ${input.programId}`);

      // Send invitation notification
      this.notifyAmbassadorInvitation(input.creatorId, input.programId).catch((err) => {
        logger.error('Failed to notify ambassador invitation:', err);
      });

      return ambassador;
    } catch (error) {
      logger.error('Error inviting ambassador:', error);
      throw error;
    }
  }

  /**
   * Accept ambassador invitation
   */
  async acceptInvitation(ambassadorId: string, creatorId: string): Promise<Ambassador> {
    try {
      const ambassador = await prisma.ambassador.findUnique({
        where: { id: ambassadorId },
      });

      if (!ambassador) {
        throw new AppError(404, 'Ambassador invitation not found');
      }

      if (ambassador.creatorId !== creatorId) {
        throw new AppError(403, 'Access denied');
      }

      if (ambassador.status !== AmbassadorStatus.INVITED) {
        throw new AppError(400, 'Invalid invitation status');
      }

      const updatedAmbassador = await prisma.ambassador.update({
        where: { id: ambassadorId },
        data: {
          status: AmbassadorStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });

      // Increment program count
      await prisma.ambassadorProgram.update({
        where: { id: ambassador.programId },
        data: {
          currentCount: { increment: 1 },
        },
      });

      logger.info(`Ambassador invitation accepted: ${ambassadorId}`);
      return updatedAmbassador;
    } catch (error) {
      logger.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Decline ambassador invitation
   */
  async declineInvitation(ambassadorId: string, creatorId: string): Promise<Ambassador> {
    try {
      const ambassador = await prisma.ambassador.findUnique({
        where: { id: ambassadorId },
      });

      if (!ambassador) {
        throw new AppError(404, 'Ambassador invitation not found');
      }

      if (ambassador.creatorId !== creatorId) {
        throw new AppError(403, 'Access denied');
      }

      if (ambassador.status !== AmbassadorStatus.INVITED) {
        throw new AppError(400, 'Invalid invitation status');
      }

      const updatedAmbassador = await prisma.ambassador.update({
        where: { id: ambassadorId },
        data: {
          status: AmbassadorStatus.DECLINED,
        },
      });

      logger.info(`Ambassador invitation declined: ${ambassadorId}`);
      return updatedAmbassador;
    } catch (error) {
      logger.error('Error declining invitation:', error);
      throw error;
    }
  }

  /**
   * Track ambassador performance
   */
  async trackPerformance(input: TrackPerformanceInput): Promise<Ambassador> {
    try {
      const ambassador = await prisma.ambassador.findUnique({
        where: { id: input.ambassadorId },
      });

      if (!ambassador) {
        throw new AppError(404, 'Ambassador not found');
      }

      // Merge new metrics with existing ones
      const updatedMetrics = {
        ...(ambassador.performanceMetrics as any),
        ...input.metrics,
        lastUpdated: new Date().toISOString(),
      };

      const updatedAmbassador = await prisma.ambassador.update({
        where: { id: input.ambassadorId },
        data: {
          performanceMetrics: updatedMetrics,
          lastActiveAt: new Date(),
        },
      });

      logger.info(`Ambassador performance tracked: ${input.ambassadorId}`);

      // Check if tier upgrade is needed
      this.checkTierUpgrade(input.ambassadorId).catch((err) => {
        logger.error('Failed to check tier upgrade:', err);
      });

      return updatedAmbassador;
    } catch (error) {
      logger.error('Error tracking performance:', error);
      throw error;
    }
  }

  /**
   * Upgrade ambassador tier
   */
  async upgradeTier(ambassadorId: string, newTier: string, upgradedBy: string): Promise<Ambassador> {
    try {
      const ambassador = await prisma.ambassador.findUnique({
        where: { id: ambassadorId },
        include: { program: true },
      });

      if (!ambassador) {
        throw new AppError(404, 'Ambassador not found');
      }

      // Verify the new tier exists in the program
      const program = ambassador.program;
      const tierExists = (program.tiers as any[]).some((tier) => tier.name === newTier);

      if (!tierExists) {
        throw new AppError(400, 'Invalid tier for this program');
      }

      const updatedAmbassador = await prisma.ambassador.update({
        where: { id: ambassadorId },
        data: { tier: newTier },
      });

      logger.info(`Ambassador tier upgraded: ${ambassadorId} to ${newTier}`);

      // Notify ambassador of upgrade
      this.notifyTierUpgrade(ambassador.creatorId, newTier).catch((err) => {
        logger.error('Failed to notify tier upgrade:', err);
      });

      return updatedAmbassador;
    } catch (error) {
      logger.error('Error upgrading tier:', error);
      throw error;
    }
  }

  /**
   * Pause ambassador
   */
  async pauseAmbassador(ambassadorId: string, pausedBy: string): Promise<Ambassador> {
    try {
      const ambassador = await prisma.ambassador.update({
        where: { id: ambassadorId },
        data: { status: AmbassadorStatus.PAUSED },
      });

      logger.info(`Ambassador paused: ${ambassadorId}`);
      return ambassador;
    } catch (error) {
      logger.error('Error pausing ambassador:', error);
      throw error;
    }
  }

  /**
   * Terminate ambassador
   */
  async terminateAmbassador(ambassadorId: string, terminatedBy: string): Promise<Ambassador> {
    try {
      const ambassador = await prisma.ambassador.findUnique({
        where: { id: ambassadorId },
      });

      if (!ambassador) {
        throw new AppError(404, 'Ambassador not found');
      }

      const updatedAmbassador = await prisma.ambassador.update({
        where: { id: ambassadorId },
        data: {
          status: AmbassadorStatus.TERMINATED,
          terminatedAt: new Date(),
        },
      });

      // Decrement program count if ambassador was active
      if (ambassador.status === AmbassadorStatus.ACTIVE) {
        await prisma.ambassadorProgram.update({
          where: { id: ambassador.programId },
          data: {
            currentCount: { decrement: 1 },
          },
        });
      }

      logger.info(`Ambassador terminated: ${ambassadorId}`);
      return updatedAmbassador;
    } catch (error) {
      logger.error('Error terminating ambassador:', error);
      throw error;
    }
  }

  /**
   * Get ambassador details
   */
  async getAmbassadorById(ambassadorId: string): Promise<any> {
    const ambassador = await prisma.ambassador.findUnique({
      where: { id: ambassadorId },
      include: {
        program: true,
      },
    });

    if (!ambassador) {
      throw new AppError(404, 'Ambassador not found');
    }

    return ambassador;
  }

  /**
   * List ambassadors for a program
   */
  async listProgramAmbassadors(
    programId: string,
    filters?: {
      status?: AmbassadorStatus;
      tier?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    ambassadors: Ambassador[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { programId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tier) {
      where.tier = filters.tier;
    }

    const [ambassadors, total] = await Promise.all([
      prisma.ambassador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
      }),
      prisma.ambassador.count({ where }),
    ]);

    return {
      ambassadors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Private helper methods

  private async notifyAmbassadorInvitation(creatorId: string, programId: string): Promise<void> {
    logger.info(`Notifying creator ${creatorId} of ambassador invitation to program ${programId}`);
  }

  private async notifyTierUpgrade(creatorId: string, newTier: string): Promise<void> {
    logger.info(`Notifying creator ${creatorId} of tier upgrade to ${newTier}`);
  }

  private async checkTierUpgrade(ambassadorId: string): Promise<void> {
    // Logic to automatically upgrade tier based on performance metrics
    logger.info(`Checking tier upgrade eligibility for ambassador ${ambassadorId}`);
  }
}

export default new AmbassadorService();
