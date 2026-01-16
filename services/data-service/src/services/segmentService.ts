import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  CreateSegmentInput,
  UpdateSegmentInput,
  AddMembersInput,
  SegmentQuery,
  MemberQuery,
} from '../types/segment';

export class SegmentService {
  async create(input: CreateSegmentInput) {
    const { rules, ...data } = input;

    const segment = await prisma.segment.create({
      data: {
        ...data,
        rules: rules as any,
        ruleSet: rules
          ? {
              create: rules.map((rule, index) => ({
                field: rule.field,
                operator: rule.operator,
                value: rule.value as any,
                groupId: rule.groupId,
                groupLogic: rule.groupLogic,
                priority: rule.priority ?? index,
              })),
            }
          : undefined,
      },
      include: {
        ruleSet: true,
        _count: { select: { members: true } },
      },
    });

    logger.info({ segmentId: segment.id, name: segment.name }, 'Segment created');
    return segment;
  }

  async findAll(query: SegmentQuery) {
    const { page, limit, sortBy, sortOrder, search, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { members: true } },
        },
      }),
      prisma.segment.count({ where }),
    ]);

    return {
      segments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const segment = await prisma.segment.findUnique({
      where: { id },
      include: {
        ruleSet: {
          where: { isActive: true },
          orderBy: { priority: 'asc' },
        },
        _count: { select: { members: true } },
      },
    });

    return segment;
  }

  async update(id: string, input: UpdateSegmentInput) {
    const { rules, ...data } = input;

    if (rules !== undefined) {
      await prisma.segmentRule.deleteMany({ where: { segmentId: id } });

      if (rules && rules.length > 0) {
        await prisma.segmentRule.createMany({
          data: rules.map((rule, index) => ({
            segmentId: id,
            field: rule.field,
            operator: rule.operator,
            value: rule.value as any,
            groupId: rule.groupId,
            groupLogic: rule.groupLogic,
            priority: rule.priority ?? index,
          })),
        });
      }
    }

    const segment = await prisma.segment.update({
      where: { id },
      data: {
        ...data,
        rules: rules as any,
      },
      include: {
        ruleSet: {
          where: { isActive: true },
          orderBy: { priority: 'asc' },
        },
        _count: { select: { members: true } },
      },
    });

    logger.info({ segmentId: segment.id }, 'Segment updated');
    return segment;
  }

  async delete(id: string) {
    await prisma.segment.delete({ where: { id } });
    logger.info({ segmentId: id }, 'Segment deleted');
  }

  async addMembers(segmentId: string, input: AddMembersInput) {
    const results = {
      added: 0,
      skipped: 0,
      errors: [] as { entityId: string; error: string }[],
    };

    for (const member of input.members) {
      try {
        await prisma.segmentMember.upsert({
          where: {
            segmentId_entityType_entityId: {
              segmentId,
              entityType: member.entityType,
              entityId: member.entityId,
            },
          },
          create: {
            segmentId,
            entityType: member.entityType,
            entityId: member.entityId,
            attributes: member.attributes as any,
            expiresAt: member.expiresAt ? new Date(member.expiresAt) : null,
          },
          update: {
            attributes: member.attributes as any,
            expiresAt: member.expiresAt ? new Date(member.expiresAt) : null,
          },
        });
        results.added++;
      } catch (error) {
        results.errors.push({
          entityId: member.entityId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const memberCount = await prisma.segmentMember.count({ where: { segmentId } });
    await prisma.segment.update({
      where: { id: segmentId },
      data: { memberCount },
    });

    logger.info({ segmentId, added: results.added }, 'Members added to segment');
    return results;
  }

  async getMembers(segmentId: string, query: MemberQuery) {
    const { page, limit, entityType } = query;
    const skip = (page - 1) * limit;

    const where: any = { segmentId };
    if (entityType) where.entityType = entityType;

    const [members, total] = await Promise.all([
      prisma.segmentMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { addedAt: 'desc' },
      }),
      prisma.segmentMember.count({ where }),
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async removeMember(segmentId: string, entityType: string, entityId: string) {
    await prisma.segmentMember.delete({
      where: {
        segmentId_entityType_entityId: {
          segmentId,
          entityType,
          entityId,
        },
      },
    });

    const memberCount = await prisma.segmentMember.count({ where: { segmentId } });
    await prisma.segment.update({
      where: { id: segmentId },
      data: { memberCount },
    });

    logger.info({ segmentId, entityType, entityId }, 'Member removed from segment');
  }
}

export const segmentService = new SegmentService();
