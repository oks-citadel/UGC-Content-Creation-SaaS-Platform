import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { Activation, ActivationStatus, CreateActivationInput } from '../types/activation';
import { logger } from '../lib/logger';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class ActivationService {
  async create(data: CreateActivationInput): Promise<Activation> {
    const activation = await prisma.activation.create({
      data: {
        id: uuidv4(),
        organizationId: data.brandId, // Use brandId as organizationId for now
        brandId: data.brandId,
        contentId: data.contentId,
        campaignId: data.campaignId,
        name: data.name,
        slug: generateSlug(data.name),
        type: data.type,
        status: ActivationStatus.DRAFT,
        config: data.config as any,
        targeting: data.targeting as any,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdBy: data.brandId, // Use brandId as createdBy for now
      },
    });
    logger.info({ activationId: activation.id }, 'Activation created');
    return activation as unknown as Activation;
  }

  async getById(id: string): Promise<Activation | null> {
    const activation = await prisma.activation.findUnique({ where: { id } });
    return activation as unknown as Activation | null;
  }

  async getByBrand(brandId: string): Promise<Activation[]> {
    const activations = await prisma.activation.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    });
    return activations as unknown as Activation[];
  }

  async update(id: string, data: Partial<Activation>): Promise<Activation> {
    const activation = await prisma.activation.update({
      where: { id },
      data: {
        ...data,
        config: data.config as any,
        targeting: data.targeting as any,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    logger.info({ activationId: id }, 'Activation updated');
    return activation as unknown as Activation;
  }

  async delete(id: string): Promise<void> {
    await prisma.activation.delete({ where: { id } });
    logger.info({ activationId: id }, 'Activation deleted');
  }

  async activate(id: string): Promise<Activation> {
    return this.update(id, { status: ActivationStatus.ACTIVE });
  }

  async pause(id: string): Promise<Activation> {
    return this.update(id, { status: ActivationStatus.PAUSED });
  }
}

export const activationService = new ActivationService();
