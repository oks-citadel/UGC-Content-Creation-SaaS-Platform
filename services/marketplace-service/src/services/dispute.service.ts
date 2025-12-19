import { PrismaClient, Dispute, DisputeStatus, Role, Priority } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import logger from '../utils/logger';
import contractService from './contract.service';

const prisma = new PrismaClient();

interface RaiseDisputeInput {
  contractId: string;
  raisedBy: string;
  raisedByRole: Role;
  reason: string;
  description: string;
  evidence?: any[];
  priority?: Priority;
}

interface RespondToDisputeInput {
  message: string;
  senderId: string;
  senderRole: Role;
  attachments?: any[];
}

interface ResolveDisputeInput {
  resolvedBy: string;
  resolution: string;
}

export class DisputeService {
  /**
   * Raise a dispute
   */
  async raiseDispute(input: RaiseDisputeInput): Promise<Dispute> {
    try {
      // Validate contract exists and user has access
      const contract = await prisma.contract.findUnique({
        where: { id: input.contractId },
      });

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      // Verify the person raising dispute is part of the contract
      if (
        input.raisedByRole === Role.CREATOR && contract.creatorId !== input.raisedBy ||
        input.raisedByRole === Role.BRAND && contract.brandId !== input.raisedBy
      ) {
        throw new AppError(403, 'You are not authorized to raise a dispute for this contract');
      }

      // Check if there's already an open dispute
      const existingDispute = await prisma.dispute.findFirst({
        where: {
          contractId: input.contractId,
          status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.AWAITING_RESPONSE] },
        },
      });

      if (existingDispute) {
        throw new AppError(400, 'An active dispute already exists for this contract');
      }

      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          contractId: input.contractId,
          raisedBy: input.raisedBy,
          raisedByRole: input.raisedByRole,
          reason: input.reason,
          description: input.description,
          evidence: input.evidence || [],
          status: DisputeStatus.OPEN,
          priority: input.priority || Priority.MEDIUM,
        },
      });

      // Update contract status to disputed
      await contractService.markAsDisputed(input.contractId);

      logger.info(`Dispute raised: ${dispute.id} for contract ${input.contractId}`);

      // Notify the other party and admins
      this.notifyDisputeParties(dispute.id).catch((err) => {
        logger.error('Failed to notify dispute parties:', err);
      });

      return dispute;
    } catch (error) {
      logger.error('Error raising dispute:', error);
      throw error;
    }
  }

  /**
   * Respond to a dispute
   */
  async respondToDispute(disputeId: string, input: RespondToDisputeInput): Promise<any> {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { contract: true },
      });

      if (!dispute) {
        throw new AppError(404, 'Dispute not found');
      }

      // Verify sender has access to this dispute
      if (
        input.senderRole === Role.CREATOR && dispute.contract.creatorId !== input.senderId ||
        input.senderRole === Role.BRAND && dispute.contract.brandId !== input.senderId
      ) {
        throw new AppError(403, 'Access denied');
      }

      // Create message
      const message = await prisma.disputeMessage.create({
        data: {
          disputeId,
          senderId: input.senderId,
          senderRole: input.senderRole,
          message: input.message,
          attachments: input.attachments || [],
        },
      });

      // Update dispute status if needed
      if (dispute.status === DisputeStatus.OPEN) {
        await prisma.dispute.update({
          where: { id: disputeId },
          data: { status: DisputeStatus.UNDER_REVIEW },
        });
      }

      logger.info(`Response added to dispute: ${disputeId}`);
      return message;
    } catch (error) {
      logger.error('Error responding to dispute:', error);
      throw error;
    }
  }

  /**
   * Escalate a dispute
   */
  async escalateDispute(disputeId: string, escalatedBy: string): Promise<Dispute> {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new AppError(404, 'Dispute not found');
      }

      if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
        throw new AppError(400, 'Cannot escalate a resolved or closed dispute');
      }

      const updatedDispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.ESCALATED,
          priority: Priority.HIGH,
        },
      });

      logger.info(`Dispute escalated: ${disputeId} by ${escalatedBy}`);

      // Notify administrators
      this.notifyAdministrators(disputeId).catch((err) => {
        logger.error('Failed to notify administrators:', err);
      });

      return updatedDispute;
    } catch (error) {
      logger.error('Error escalating dispute:', error);
      throw error;
    }
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(disputeId: string, input: ResolveDisputeInput): Promise<Dispute> {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new AppError(404, 'Dispute not found');
      }

      if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
        throw new AppError(400, 'Dispute is already resolved or closed');
      }

      const resolvedDispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution: input.resolution,
          resolvedBy: input.resolvedBy,
          resolvedAt: new Date(),
        },
      });

      logger.info(`Dispute resolved: ${disputeId} by ${input.resolvedBy}`);

      // Notify all parties
      this.notifyDisputeResolution(disputeId, input.resolution).catch((err) => {
        logger.error('Failed to notify dispute resolution:', err);
      });

      return resolvedDispute;
    } catch (error) {
      logger.error('Error resolving dispute:', error);
      throw error;
    }
  }

  /**
   * Close a dispute
   */
  async closeDispute(disputeId: string, closedBy: string): Promise<Dispute> {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new AppError(404, 'Dispute not found');
      }

      if (dispute.status !== DisputeStatus.RESOLVED) {
        throw new AppError(400, 'Can only close resolved disputes');
      }

      const closedDispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.CLOSED,
        },
      });

      logger.info(`Dispute closed: ${disputeId}`);
      return closedDispute;
    } catch (error) {
      logger.error('Error closing dispute:', error);
      throw error;
    }
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(disputeId: string, userId: string): Promise<any> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new AppError(404, 'Dispute not found');
    }

    // Verify access
    if (
      dispute.contract.creatorId !== userId &&
      dispute.contract.brandId !== userId &&
      !dispute.assignedTo // Admin check would go here
    ) {
      throw new AppError(403, 'Access denied');
    }

    return dispute;
  }

  /**
   * List disputes with filters
   */
  async listDisputes(
    filters?: {
      userId?: string;
      userRole?: Role;
      status?: DisputeStatus;
      priority?: Priority;
      contractId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    disputes: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.contractId) {
      where.contractId = filters.contractId;
    }

    // If user-specific, filter by role
    if (filters?.userId && filters?.userRole) {
      if (filters.userRole === Role.CREATOR) {
        where.contract = {
          creatorId: filters.userId,
        };
      } else if (filters.userRole === Role.BRAND) {
        where.contract = {
          brandId: filters.userId,
        };
      }
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            select: {
              contractNumber: true,
              creatorId: true,
              brandId: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Assign dispute to mediator/admin
   */
  async assignDispute(disputeId: string, assignedTo: string): Promise<Dispute> {
    try {
      const dispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          assignedTo,
          status: DisputeStatus.UNDER_REVIEW,
        },
      });

      logger.info(`Dispute ${disputeId} assigned to ${assignedTo}`);
      return dispute;
    } catch (error) {
      logger.error('Error assigning dispute:', error);
      throw error;
    }
  }

  // Private helper methods

  private async notifyDisputeParties(disputeId: string): Promise<void> {
    // Implementation would notify both parties and admins
    logger.info(`Notifying parties of dispute: ${disputeId}`);
  }

  private async notifyAdministrators(disputeId: string): Promise<void> {
    // Implementation would notify platform administrators
    logger.info(`Notifying administrators of escalated dispute: ${disputeId}`);
  }

  private async notifyDisputeResolution(disputeId: string, resolution: string): Promise<void> {
    // Implementation would notify all parties of resolution
    logger.info(`Notifying parties of dispute resolution: ${disputeId}`);
  }
}

export default new DisputeService();
