import creatorService from '../services/creator.service';
import prisma from '../lib/prisma';
import { NotFoundError, ConflictError } from '../middleware/error-handler';

// Mock Prisma client
jest.mock('../lib/prisma', () => ({
  creator: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  creatorMetrics: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  creatorEarnings: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  creatorPortfolio: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('CreatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCreator', () => {
    const mockCreatorData = {
      userId: 'user-123',
      email: 'creator@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'JohnDoe',
    };

    it('should create a new creator successfully', async () => {
      const mockCreator = {
        id: 'creator-123',
        ...mockCreatorData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.creator.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.creator.create as jest.Mock).mockResolvedValue(mockCreator);

      const result = await creatorService.createCreator(mockCreatorData);

      expect(result).toEqual(mockCreator);
      expect(prisma.creator.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining(mockCreatorData),
        })
      );
    });

    it('should throw ConflictError if creator already exists for user', async () => {
      (prisma.creator.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-creator',
      });

      await expect(creatorService.createCreator(mockCreatorData)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('getCreator', () => {
    it('should return creator by ID', async () => {
      const mockCreator = {
        id: 'creator-123',
        email: 'creator@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.creator.findUnique as jest.Mock).mockResolvedValue(mockCreator);

      const result = await creatorService.getCreator('creator-123');

      expect(result).toEqual(mockCreator);
      expect(prisma.creator.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'creator-123' },
        })
      );
    });

    it('should throw NotFoundError if creator does not exist', async () => {
      (prisma.creator.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(creatorService.getCreator('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateCreator', () => {
    it('should update creator successfully', async () => {
      const updateData = {
        displayName: 'NewDisplayName',
        bio: 'Updated bio',
      };

      const mockUpdatedCreator = {
        id: 'creator-123',
        ...updateData,
      };

      (prisma.creator.update as jest.Mock).mockResolvedValue(mockUpdatedCreator);

      const result = await creatorService.updateCreator('creator-123', updateData);

      expect(result).toEqual(mockUpdatedCreator);
      expect(prisma.creator.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'creator-123' },
          data: expect.objectContaining(updateData),
        })
      );
    });
  });

  describe('listCreators', () => {
    it('should list creators with pagination', async () => {
      const mockCreators = [
        { id: 'creator-1', firstName: 'John', lastName: 'Doe' },
        { id: 'creator-2', firstName: 'Jane', lastName: 'Smith' },
      ];

      (prisma.creator.findMany as jest.Mock).mockResolvedValue(mockCreators);
      (prisma.creator.count as jest.Mock).mockResolvedValue(2);

      const result = await creatorService.listCreators({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockCreators);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter creators by status', async () => {
      (prisma.creator.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.creator.count as jest.Mock).mockResolvedValue(0);

      await creatorService.listCreators({ status: 'ACTIVE' as any });

      expect(prisma.creator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        })
      );
    });
  });

  describe('getMetrics', () => {
    it('should return creator metrics', async () => {
      const mockMetrics = {
        id: 'metrics-123',
        creatorId: 'creator-123',
        totalFollowers: 10000,
        avgEngagementRate: 0.05,
      };

      (prisma.creatorMetrics.findUnique as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await creatorService.getMetrics('creator-123');

      expect(result).toEqual(mockMetrics);
    });

    it('should throw NotFoundError if metrics not found', async () => {
      (prisma.creatorMetrics.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(creatorService.getMetrics('creator-123')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('addPortfolioItem', () => {
    it('should add portfolio item successfully', async () => {
      const portfolioData = {
        title: 'Sample Work',
        description: 'Description',
        mediaType: 'IMAGE' as const,
        mediaUrl: 'https://example.com/image.jpg',
      };

      const mockCreator = { id: 'creator-123' };
      const mockPortfolioItem = {
        id: 'portfolio-123',
        creatorId: 'creator-123',
        ...portfolioData,
      };

      (prisma.creator.findUnique as jest.Mock).mockResolvedValue(mockCreator);
      (prisma.creatorPortfolio.create as jest.Mock).mockResolvedValue(mockPortfolioItem);

      const result = await creatorService.addPortfolioItem('creator-123', portfolioData);

      expect(result).toEqual(mockPortfolioItem);
    });
  });
});
