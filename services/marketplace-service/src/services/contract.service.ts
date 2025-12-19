import { PrismaClient, Contract, ContractStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import logger from '../utils/logger';
import { nanoid } from 'nanoid';
import docusignIntegration from '../integrations/docusign';

const prisma = new PrismaClient();

interface GenerateContractInput {
  opportunityId: string;
  creatorId: string;
  brandId: string;
  terms: any;
  paymentTerms: any;
  totalAmount: number;
  currency: string;
  deliverables: any[];
  startDate: Date;
  endDate: Date;
  templateId?: string;
}

interface ContractTerms {
  scope: string;
  exclusivity?: boolean;
  usageRights: string[];
  revisions: number;
  contentOwnership: string;
  confidentiality: boolean;
  additionalTerms?: string[];
}

interface PaymentTerms {
  schedule: 'upfront' | 'milestone' | 'completion' | 'split';
  milestones?: {
    description: string;
    amount: number;
    dueDate: Date;
  }[];
  paymentMethod: string;
  lateFeePolicy?: string;
}

export class ContractService {
  /**
   * Generate a contract from template
   */
  async generateContract(input: GenerateContractInput): Promise<Contract> {
    try {
      // Validate opportunity and bid
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: input.opportunityId },
      });

      if (!opportunity) {
        throw new AppError(404, 'Opportunity not found');
      }

      // Check for existing active contract
      const existingContract = await prisma.contract.findFirst({
        where: {
          opportunityId: input.opportunityId,
          creatorId: input.creatorId,
          status: { in: ['DRAFT', 'PENDING_SIGNATURES', 'ACTIVE'] },
        },
      });

      if (existingContract) {
        throw new AppError(400, 'An active contract already exists for this opportunity');
      }

      // Generate unique contract number
      const contractNumber = `CNT-${new Date().getFullYear()}-${nanoid(10).toUpperCase()}`;

      // Create contract
      const contract = await prisma.contract.create({
        data: {
          contractNumber,
          opportunityId: input.opportunityId,
          creatorId: input.creatorId,
          brandId: input.brandId,
          terms: input.terms,
          paymentTerms: input.paymentTerms,
          totalAmount: input.totalAmount,
          currency: input.currency || 'USD',
          deliverables: input.deliverables,
          startDate: input.startDate,
          endDate: input.endDate,
          status: ContractStatus.DRAFT,
        },
      });

      logger.info(`Contract generated: ${contract.id} (${contractNumber})`);
      return contract;
    } catch (error) {
      logger.error('Error generating contract:', error);
      throw error;
    }
  }

  /**
   * Send contract for signature
   */
  async sendForSignature(contractId: string, senderId: string): Promise<Contract> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      if (contract.status !== 'DRAFT') {
        throw new AppError(400, 'Contract is not in draft status');
      }

      // Verify sender has permission
      if (contract.brandId !== senderId && contract.creatorId !== senderId) {
        throw new AppError(403, 'Access denied');
      }

      // Send to DocuSign
      const envelopeId = await docusignIntegration.sendContractForSignature({
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        brandId: contract.brandId,
        creatorId: contract.creatorId,
        contractData: {
          terms: contract.terms,
          paymentTerms: contract.paymentTerms,
          totalAmount: contract.totalAmount.toString(),
          currency: contract.currency,
          deliverables: contract.deliverables,
          startDate: contract.startDate,
          endDate: contract.endDate,
        },
      });

      // Update contract
      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.PENDING_SIGNATURES,
          docusignEnvelopeId: envelopeId,
        },
      });

      logger.info(`Contract sent for signature: ${contractId}, Envelope: ${envelopeId}`);
      return updatedContract;
    } catch (error) {
      logger.error('Error sending contract for signature:', error);
      throw error;
    }
  }

  /**
   * Sign contract
   */
  async signContract(contractId: string, signerId: string, role: 'creator' | 'brand'): Promise<Contract> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      if (contract.status !== 'PENDING_SIGNATURES') {
        throw new AppError(400, 'Contract is not awaiting signatures');
      }

      // Verify signer identity
      if (role === 'creator' && contract.creatorId !== signerId) {
        throw new AppError(403, 'You are not authorized to sign as creator');
      }
      if (role === 'brand' && contract.brandId !== signerId) {
        throw new AppError(403, 'You are not authorized to sign as brand');
      }

      // Update signature status
      const updateData: any = {};
      if (role === 'creator') {
        updateData.creatorSigned = true;
        updateData.creatorSignedAt = new Date();
      } else {
        updateData.brandSigned = true;
        updateData.brandSignedAt = new Date();
      }

      // Check if both parties have signed
      const bothSigned =
        (role === 'creator' && contract.brandSigned) ||
        (role === 'brand' && contract.creatorSigned);

      if (bothSigned) {
        updateData.status = ContractStatus.ACTIVE;
        updateData.signedAt = new Date();
      }

      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: updateData,
      });

      logger.info(`Contract signed by ${role}: ${contractId}`);

      // If fully signed, activate the contract
      if (bothSigned) {
        await this.activateContract(contractId);
      }

      return updatedContract;
    } catch (error) {
      logger.error('Error signing contract:', error);
      throw error;
    }
  }

  /**
   * Get contract status
   */
  async getContractStatus(contractId: string): Promise<{
    contract: Contract;
    docusignStatus?: any;
  }> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      let docusignStatus;
      if (contract.docusignEnvelopeId) {
        try {
          docusignStatus = await docusignIntegration.getEnvelopeStatus(
            contract.docusignEnvelopeId
          );
        } catch (error) {
          logger.error('Error fetching DocuSign status:', error);
        }
      }

      return {
        contract,
        docusignStatus,
      };
    } catch (error) {
      logger.error('Error getting contract status:', error);
      throw error;
    }
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string, userId: string): Promise<Contract> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        opportunity: true,
        payouts: true,
        disputes: true,
      },
    });

    if (!contract) {
      throw new AppError(404, 'Contract not found');
    }

    // Verify access
    if (contract.creatorId !== userId && contract.brandId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return contract;
  }

  /**
   * List contracts with filters
   */
  async listContracts(
    userId: string,
    userRole: 'creator' | 'brand',
    filters?: {
      status?: ContractStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userRole === 'creator') {
      where.creatorId = userId;
    } else {
      where.brandId = userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      contracts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Terminate contract
   */
  async terminateContract(
    contractId: string,
    terminatedBy: string,
    reason: string
  ): Promise<Contract> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      if (contract.status !== 'ACTIVE') {
        throw new AppError(400, 'Only active contracts can be terminated');
      }

      // Verify terminator has permission
      if (contract.creatorId !== terminatedBy && contract.brandId !== terminatedBy) {
        throw new AppError(403, 'Access denied');
      }

      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.TERMINATED,
          terminatedAt: new Date(),
          terminationReason: reason,
        },
      });

      logger.info(`Contract terminated: ${contractId} by ${terminatedBy}`);
      return updatedContract;
    } catch (error) {
      logger.error('Error terminating contract:', error);
      throw error;
    }
  }

  /**
   * Update contract to disputed status
   */
  async markAsDisputed(contractId: string): Promise<Contract> {
    return await prisma.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.DISPUTED },
    });
  }

  /**
   * Complete contract
   */
  async completeContract(contractId: string): Promise<Contract> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new AppError(404, 'Contract not found');
      }

      if (contract.status !== 'ACTIVE') {
        throw new AppError(400, 'Only active contracts can be completed');
      }

      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.COMPLETED,
        },
      });

      logger.info(`Contract completed: ${contractId}`);
      return updatedContract;
    } catch (error) {
      logger.error('Error completing contract:', error);
      throw error;
    }
  }

  // Private helper methods

  private async activateContract(contractId: string): Promise<void> {
    // Additional activation logic
    logger.info(`Contract activated: ${contractId}`);

    // Update opportunity status if needed
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (contract) {
      // Check if opportunity slots are filled
      const opportunityService = await import('./opportunity.service');
      await opportunityService.default.checkAndUpdateFilledStatus(contract.opportunityId);
    }
  }
}

export default new ContractService();
