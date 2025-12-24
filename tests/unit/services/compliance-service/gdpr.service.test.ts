import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock dependencies before importing the service
vi.mock('../../../../services/compliance-service/src/lib/prisma', () => ({
  prisma: {
    dataRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    consent: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    contentRights: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    disclosure: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((operations) => Promise.all(operations)),
  },
}));

vi.mock('archiver', () => ({
  default: vi.fn(() => ({
    pipe: vi.fn(),
    append: vi.fn(),
    finalize: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(callback, 10);
      }
      return { pipe: vi.fn(), append: vi.fn(), finalize: vi.fn() };
    }),
  })),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn(() => ({
      on: vi.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(callback, 10);
        }
      }),
    })),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  createWriteStream: vi.fn(() => ({
    on: vi.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(callback, 10);
      }
    }),
  })),
}));

vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock('../../../../services/compliance-service/src/config', () => ({
  config: {
    gdpr: {
      dataExportExpiryDays: 30,
    },
    storage: {
      exportPath: '/tmp/exports',
    },
  },
}));

import { GDPRService } from '../../../../services/compliance-service/src/services/gdpr.service';
import { prisma } from '../../../../services/compliance-service/src/lib/prisma';

describe('GDPRService', () => {
  let gdprService: GDPRService;

  beforeEach(() => {
    gdprService = new GDPRService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Export Request', () => {
    it('should create a data export request successfully', async () => {
      const userId = 'user-123';
      const mockRequest = {
        id: 'request-456',
        userId,
        type: 'EXPORT',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      vi.mocked(prisma.dataRequest.create).mockResolvedValue(mockRequest as any);

      const requestId = await gdprService.requestDataExport(userId);

      expect(requestId).toBe('request-456');
      expect(prisma.dataRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'EXPORT',
          status: 'PENDING',
        }),
      });
    });

    it('should set correct expiration date for export request', async () => {
      const userId = 'user-789';
      const mockRequest = {
        id: 'request-789',
        userId,
        type: 'EXPORT',
        status: 'PENDING',
        expiresAt: new Date(),
      };

      vi.mocked(prisma.dataRequest.create).mockResolvedValue(mockRequest as any);

      await gdprService.requestDataExport(userId);

      const createCall = vi.mocked(prisma.dataRequest.create).mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt as Date;
      const now = new Date();
      const daysDiff = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });

    it('should handle export request for user with no data', async () => {
      const userId = 'empty-user';
      const mockRequest = {
        id: 'request-empty',
        userId,
        type: 'EXPORT',
        status: 'PENDING',
        expiresAt: new Date(),
      };

      vi.mocked(prisma.dataRequest.create).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.consent.findMany).mockResolvedValue([]);
      vi.mocked(prisma.contentRights.findMany).mockResolvedValue([]);
      vi.mocked(prisma.disclosure.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      const requestId = await gdprService.requestDataExport(userId);

      expect(requestId).toBe('request-empty');
    });
  });

  describe('Data Deletion Request', () => {
    it('should create a data deletion request successfully', async () => {
      const userId = 'user-delete-123';
      const notes = 'User requested account deletion';
      const mockRequest = {
        id: 'delete-request-456',
        userId,
        type: 'DELETE',
        status: 'PENDING',
        notes,
      };

      vi.mocked(prisma.dataRequest.create).mockResolvedValue(mockRequest as any);

      const requestId = await gdprService.requestDataDeletion(userId, notes);

      expect(requestId).toBe('delete-request-456');
      expect(prisma.dataRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'DELETE',
          status: 'PENDING',
          notes,
        }),
      });
    });

    it('should create deletion request without notes', async () => {
      const userId = 'user-delete-789';
      const mockRequest = {
        id: 'delete-request-789',
        userId,
        type: 'DELETE',
        status: 'PENDING',
        notes: undefined,
      };

      vi.mocked(prisma.dataRequest.create).mockResolvedValue(mockRequest as any);

      const requestId = await gdprService.requestDataDeletion(userId);

      expect(requestId).toBe('delete-request-789');
    });
  });

  describe('Process Data Deletion', () => {
    it('should process data deletion successfully', async () => {
      const requestId = 'delete-request-process';
      const mockRequest = {
        id: requestId,
        userId: 'user-to-delete',
        type: 'DELETE',
        status: 'PENDING',
      };

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.dataRequest.update).mockResolvedValue({
        ...mockRequest,
        status: 'COMPLETED',
      } as any);
      vi.mocked(prisma.consent.deleteMany).mockResolvedValue({ count: 3 } as any);
      vi.mocked(prisma.disclosure.deleteMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.contentRights.deleteMany).mockResolvedValue({ count: 2 } as any);

      await gdprService.processDataDeletion(requestId);

      expect(prisma.dataRequest.update).toHaveBeenCalledWith({
        where: { id: requestId },
        data: expect.objectContaining({
          status: 'PROCESSING',
        }),
      });
    });

    it('should throw error for invalid deletion request', async () => {
      const requestId = 'invalid-request';

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(null);

      await expect(gdprService.processDataDeletion(requestId)).rejects.toThrow(
        'Invalid deletion request'
      );
    });

    it('should throw error if request type is not DELETE', async () => {
      const requestId = 'export-not-delete';
      const mockRequest = {
        id: requestId,
        userId: 'user-123',
        type: 'EXPORT',
        status: 'PENDING',
      };

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(mockRequest as any);

      await expect(gdprService.processDataDeletion(requestId)).rejects.toThrow(
        'Invalid deletion request'
      );
    });

    it('should handle deletion failure gracefully', async () => {
      const requestId = 'delete-fail-request';
      const mockRequest = {
        id: requestId,
        userId: 'user-fail',
        type: 'DELETE',
        status: 'PENDING',
      };

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.dataRequest.update).mockResolvedValueOnce({
        ...mockRequest,
        status: 'PROCESSING',
      } as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));
      vi.mocked(prisma.dataRequest.update).mockResolvedValueOnce({
        ...mockRequest,
        status: 'FAILED',
        notes: 'Database error',
      } as any);

      await expect(gdprService.processDataDeletion(requestId)).rejects.toThrow('Database error');
    });

    it('should delete all related user data in transaction', async () => {
      const requestId = 'delete-all-data';
      const userId = 'user-complete-delete';
      const mockRequest = {
        id: requestId,
        userId,
        type: 'DELETE',
        status: 'PENDING',
      };

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.dataRequest.update).mockResolvedValue({
        ...mockRequest,
        status: 'COMPLETED',
      } as any);

      const deleteConsentMock = vi.mocked(prisma.consent.deleteMany);
      const deleteDisclosureMock = vi.mocked(prisma.disclosure.deleteMany);
      const deleteContentRightsMock = vi.mocked(prisma.contentRights.deleteMany);

      deleteConsentMock.mockResolvedValue({ count: 5 } as any);
      deleteDisclosureMock.mockResolvedValue({ count: 2 } as any);
      deleteContentRightsMock.mockResolvedValue({ count: 3 } as any);

      await gdprService.processDataDeletion(requestId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should handle empty userId for export request', async () => {
      const mockRequest = {
        id: 'request-empty-user',
        userId: '',
        type: 'EXPORT',
        status: 'PENDING',
        expiresAt: new Date(),
      };

      vi.mocked(prisma.dataRequest.create).mockResolvedValue(mockRequest as any);

      const requestId = await gdprService.requestDataExport('');

      expect(requestId).toBe('request-empty-user');
    });

    it('should handle special characters in userId', async () => {
      const userId = 'user-123!@#$%^&*()';
      const mockRequest = {
        id: 'request-special',
        userId,
        type: 'EXPORT',
        status: 'PENDING',
        expiresAt: new Date(),
      };

      vi.mocked(prisma.dataRequest.create).mockResolvedValue(mockRequest as any);

      const requestId = await gdprService.requestDataExport(userId);

      expect(requestId).toBe('request-special');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors on export request', async () => {
      vi.mocked(prisma.dataRequest.create).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(gdprService.requestDataExport('user-123')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle database connection errors on deletion request', async () => {
      vi.mocked(prisma.dataRequest.create).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(gdprService.requestDataDeletion('user-123')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle timeout errors during deletion processing', async () => {
      const requestId = 'timeout-request';
      const mockRequest = {
        id: requestId,
        userId: 'user-timeout',
        type: 'DELETE',
        status: 'PENDING',
      };

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.dataRequest.update).mockResolvedValueOnce({
        ...mockRequest,
        status: 'PROCESSING',
      } as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Query timeout'));
      vi.mocked(prisma.dataRequest.update).mockResolvedValueOnce({
        ...mockRequest,
        status: 'FAILED',
      } as any);

      await expect(gdprService.processDataDeletion(requestId)).rejects.toThrow('Query timeout');
    });
  });

  describe('Data Request Status Transitions', () => {
    it('should transition from PENDING to PROCESSING during deletion', async () => {
      const requestId = 'status-transition';
      const mockRequest = {
        id: requestId,
        userId: 'user-status',
        type: 'DELETE',
        status: 'PENDING',
      };

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.dataRequest.update).mockResolvedValue({
        ...mockRequest,
        status: 'COMPLETED',
      } as any);

      await gdprService.processDataDeletion(requestId);

      const firstUpdateCall = vi.mocked(prisma.dataRequest.update).mock.calls[0];
      expect(firstUpdateCall[0].data).toMatchObject({
        status: 'PROCESSING',
        processedAt: expect.any(Date),
      });
    });

    it('should transition to COMPLETED after successful deletion', async () => {
      const requestId = 'complete-transition';
      const mockRequest = {
        id: requestId,
        userId: 'user-complete',
        type: 'DELETE',
        status: 'PENDING',
      };

      vi.mocked(prisma.dataRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.dataRequest.update).mockResolvedValue({
        ...mockRequest,
        status: 'COMPLETED',
      } as any);

      await gdprService.processDataDeletion(requestId);

      const lastUpdateCall = vi.mocked(prisma.dataRequest.update).mock.calls.pop();
      expect(lastUpdateCall?.[0].data).toMatchObject({
        status: 'COMPLETED',
        completedAt: expect.any(Date),
      });
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple export requests for same user', async () => {
      const userId = 'user-concurrent';
      const mockRequests = [
        { id: 'request-1', userId, type: 'EXPORT', status: 'PENDING' },
        { id: 'request-2', userId, type: 'EXPORT', status: 'PENDING' },
      ];

      vi.mocked(prisma.dataRequest.create)
        .mockResolvedValueOnce(mockRequests[0] as any)
        .mockResolvedValueOnce(mockRequests[1] as any);

      const [requestId1, requestId2] = await Promise.all([
        gdprService.requestDataExport(userId),
        gdprService.requestDataExport(userId),
      ]);

      expect(requestId1).toBe('request-1');
      expect(requestId2).toBe('request-2');
    });
  });
});
