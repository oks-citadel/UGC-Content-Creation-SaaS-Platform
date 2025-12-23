import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('uuid', () => ({ v4: vi.fn(() => 'mock-uuid-1234') }));

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      addPage: vi.fn().mockReturnValue({
        getSize: vi.fn().mockReturnValue({ width: 612, height: 792 }),
        drawText: vi.fn(),
      }),
      embedFont: vi.fn().mockResolvedValue({}),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
  },
  StandardFonts: { Helvetica: 'Helvetica', HelveticaBold: 'Helvetica-Bold' },
}));

vi.mock('handlebars', () => ({
  default: { compile: vi.fn(() => vi.fn(() => '<html>Mock License</html>')) },
}));

vi.mock('../../../../services/rights-service/src/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../../services/rights-service/src/middleware/error-handler', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number, public code: string) {
      super(message);
      this.name = 'AppError';
    }
  },
}));

import { RightsService } from '../../../../services/rights-service/src/services/rights.service';

describe('RightsService', () => {
  let rightsService: RightsService;

  beforeEach(() => {
    rightsService = new RightsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('License Creation', () => {
    it('should create content rights successfully', async () => {
      const params = {
        contentId: 'content-123',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website', 'social'] as const,
          territories: ['US', 'UK'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 5000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights).toHaveProperty('id');
      expect(rights.contentId).toBe('content-123');
      expect(rights.creatorId).toBe('creator-456');
      expect(rights.brandId).toBe('brand-789');
      expect(rights.status).toBe('draft');
      expect(rights.signedByCreator).toBe(false);
      expect(rights.signedByBrand).toBe(false);
    });

    it('should throw error if active rights already exist', async () => {
      const params = {
        contentId: 'content-duplicate',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['all'] as const,
          territories: ['GLOBAL'],
          duration: 'perpetual' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'not_allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 10000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);

      const rights = await rightsService.getContentRights('content-duplicate');
      if (rights) {
        rights.status = 'active';
      }

      await expect(rightsService.createContentRights(params)).rejects.toThrow('RIGHTS_EXIST');
    });

    it('should calculate expiration date for 1-year duration', async () => {
      const params = {
        contentId: 'content-expiry',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 1000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.expirationDate).toBeDefined();
      const expirationDate = new Date(rights.expirationDate!);
      const now = new Date();
      const daysDiff = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(364);
      expect(daysDiff).toBeLessThanOrEqual(366);
    });

    it('should not set expiration for perpetual rights', async () => {
      const params = {
        contentId: 'content-perpetual',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['all'] as const,
          territories: ['GLOBAL'],
          duration: 'perpetual' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'with_approval' as const,
        },
        compensation: {
          type: 'royalty' as const,
          currency: 'USD',
          royaltyPercent: 10,
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.expirationDate).toBeUndefined();
    });
  });

  describe('Usage Rights Validation', () => {
    it('should validate platform restrictions', async () => {
      const params = {
        contentId: 'content-platforms',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website', 'social', 'paid_ads'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 3000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.platforms).toContain('website');
      expect(rights.usageRights.platforms).toContain('social');
      expect(rights.usageRights.platforms).toContain('paid_ads');
      expect(rights.usageRights.platforms).not.toContain('broadcast');
    });

    it('should validate territory restrictions', async () => {
      const params = {
        contentId: 'content-territories',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US', 'CA', 'UK', 'AU'],
          duration: '2_years' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 5000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.territories).toHaveLength(4);
      expect(rights.usageRights.territories).toContain('US');
    });
  });

  describe('Contract Generation', () => {
    it('should generate HTML license agreement', async () => {
      const params = {
        contentId: 'content-html-license',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);
      const license = await rightsService.getLicenseAgreement('content-html-license', 'html');

      expect(license).toHaveProperty('id');
      expect(license).toHaveProperty('rightsId');
      expect(license.status).toBe('draft');
    });

    it('should generate PDF license agreement', async () => {
      const params = {
        contentId: 'content-pdf-license',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);
      const license = await rightsService.getLicenseAgreement('content-pdf-license', 'pdf');

      expect(license).toHaveProperty('id');
      expect(license.document).toBeDefined();
    });

    it('should throw error for non-existent content rights', async () => {
      await expect(
        rightsService.getLicenseAgreement('non-existent-content', 'json')
      ).rejects.toThrow('RIGHTS_NOT_FOUND');
    });
  });

  describe('Rights Expiration Checks', () => {
    it('should sign license as creator', async () => {
      const params = {
        contentId: 'content-sign',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);

      const signatureData = {
        signatureData: 'base64-signature-data',
        signedAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
      };

      const signedRights = await rightsService.signLicense('content-sign', 'creator-456', signatureData);

      expect(signedRights.signedByCreator).toBe(true);
      expect(signedRights.creatorSignedAt).toBeDefined();
      expect(signedRights.status).toBe('pending_signature');
    });

    it('should throw error when unauthorized user tries to sign', async () => {
      const params = {
        contentId: 'content-unauthorized',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);

      const signatureData = {
        signatureData: 'base64-signature-data',
        signedAt: new Date().toISOString(),
      };

      await expect(
        rightsService.signLicense('content-unauthorized', 'wrong-creator-id', signatureData)
      ).rejects.toThrow('UNAUTHORIZED');
    });

    it('should track rights history', async () => {
      const params = {
        contentId: 'content-history',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);
      const history = await rightsService.getRightsHistory('content-history');

      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('created');
    });

    it('should transfer rights to new brand', async () => {
      const params = {
        contentId: 'content-transfer',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);

      const rights = await rightsService.getContentRights('content-transfer');
      if (rights) {
        rights.status = 'active';
      }

      const transferred = await rightsService.transferRights('content-transfer', 'new-brand-123', 'Business acquisition');

      expect(transferred.brandId).toBe('new-brand-123');
    });

    it('should revoke rights', async () => {
      const params = {
        contentId: 'content-revoke',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2000,
          currency: 'USD',
        },
      };

      await rightsService.createContentRights(params);
      await rightsService.revokeRights('content-revoke', 'Terms violation');

      const rights = await rightsService.getContentRights('content-revoke');
      expect(rights?.status).toBe('revoked');
    });
  });
});
