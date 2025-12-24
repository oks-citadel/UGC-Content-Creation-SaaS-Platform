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

      await expect(rightsService.createContentRights(params)).rejects.toThrow('Active rights already exist');
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
      ).rejects.toThrow('Rights not found');
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
      ).rejects.toThrow('Not authorized to sign');
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

  describe('Licensing Duration Validation', () => {
    it('should calculate expiration for 2-year duration', async () => {
      const params = {
        contentId: 'content-2year',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '2_years' as const,
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

      expect(rights.expirationDate).toBeDefined();
      const expirationDate = new Date(rights.expirationDate!);
      const now = new Date();
      const daysDiff = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(729);
      expect(daysDiff).toBeLessThanOrEqual(731);
    });

    it('should calculate expiration for 5-year duration', async () => {
      const params = {
        contentId: 'content-5year',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['all'] as const,
          territories: ['GLOBAL'],
          duration: '5_years' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 25000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.expirationDate).toBeDefined();
      const expirationDate = new Date(rights.expirationDate!);
      const now = new Date();
      const daysDiff = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(1824);
      expect(daysDiff).toBeLessThanOrEqual(1826);
    });

    it('should handle custom duration with specified days', async () => {
      const params = {
        contentId: 'content-custom-duration',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['social'] as const,
          territories: ['US'],
          duration: 'custom' as const,
          durationDays: 90,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 500,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.expirationDate).toBeDefined();
      const expirationDate = new Date(rights.expirationDate!);
      const now = new Date();
      const daysDiff = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(89);
      expect(daysDiff).toBeLessThanOrEqual(91);
    });

    it('should default custom duration to 365 days if not specified', async () => {
      const params = {
        contentId: 'content-custom-default',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: 'custom' as const,
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
  });

  describe('Compensation Types Validation', () => {
    it('should handle royalty-based compensation', async () => {
      const params = {
        contentId: 'content-royalty',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['all'] as const,
          territories: ['GLOBAL'],
          duration: 'perpetual' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'royalty' as const,
          currency: 'USD',
          royaltyPercent: 15,
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.compensation.type).toBe('royalty');
      expect(rights.compensation.royaltyPercent).toBe(15);
      expect(rights.compensation.amount).toBeUndefined();
    });

    it('should handle hybrid compensation', async () => {
      const params = {
        contentId: 'content-hybrid',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website', 'social', 'paid_ads'] as const,
          territories: ['US', 'EU'],
          duration: '2_years' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'with_approval' as const,
        },
        compensation: {
          type: 'hybrid' as const,
          amount: 5000,
          currency: 'USD',
          royaltyPercent: 5,
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.compensation.type).toBe('hybrid');
      expect(rights.compensation.amount).toBe(5000);
      expect(rights.compensation.royaltyPercent).toBe(5);
    });

    it('should handle different currencies', async () => {
      const params = {
        contentId: 'content-eur',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['EU'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 2500,
          currency: 'EUR',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.compensation.currency).toBe('EUR');
      expect(rights.compensation.amount).toBe(2500);
    });
  });

  describe('Exclusivity Validation', () => {
    it('should set exclusive rights correctly', async () => {
      const params = {
        contentId: 'content-exclusive',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['all'] as const,
          territories: ['GLOBAL'],
          duration: 'perpetual' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 50000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.exclusivity).toBe('exclusive');
    });

    it('should set non-exclusive rights correctly', async () => {
      const params = {
        contentId: 'content-non-exclusive',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['social'] as const,
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

      expect(rights.usageRights.exclusivity).toBe('non_exclusive');
    });
  });

  describe('Modification Rights Validation', () => {
    it('should handle modifications not allowed', async () => {
      const params = {
        contentId: 'content-no-mods',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['website'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'not_allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 1500,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.modifications).toBe('not_allowed');
    });

    it('should handle modifications with approval', async () => {
      const params = {
        contentId: 'content-approval-mods',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['all'] as const,
          territories: ['GLOBAL'],
          duration: '2_years' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'with_approval' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 10000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.modifications).toBe('with_approval');
    });
  });

  describe('License Signature Workflow', () => {
    it('should prevent double signing by creator', async () => {
      const params = {
        contentId: 'content-double-sign',
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

      await rightsService.signLicense('content-double-sign', 'creator-456', signatureData);

      await expect(
        rightsService.signLicense('content-double-sign', 'creator-456', signatureData)
      ).rejects.toThrow('already signed');
    });

    it('should throw error when signing non-existent rights', async () => {
      const signatureData = {
        signatureData: 'base64-signature-data',
        signedAt: new Date().toISOString(),
      };

      await expect(
        rightsService.signLicense('non-existent-content', 'creator-456', signatureData)
      ).rejects.toThrow('Rights not found');
    });
  });

  describe('Rights Transfer Validation', () => {
    it('should not allow transfer of non-active rights', async () => {
      const params = {
        contentId: 'content-draft-transfer',
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

      await expect(
        rightsService.transferRights('content-draft-transfer', 'new-brand-123', 'Test reason')
      ).rejects.toThrow('Can only transfer active rights');
    });

    it('should throw error when transferring non-existent rights', async () => {
      await expect(
        rightsService.transferRights('non-existent-content', 'new-brand-123', 'Test reason')
      ).rejects.toThrow('Rights not found');
    });

    it('should record transfer in history', async () => {
      const params = {
        contentId: 'content-transfer-history',
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

      const rights = await rightsService.getContentRights('content-transfer-history');
      if (rights) {
        rights.status = 'active';
      }

      await rightsService.transferRights('content-transfer-history', 'new-brand-456', 'Merger');

      const history = await rightsService.getRightsHistory('content-transfer-history');
      expect(history.some(h => h.action === 'transferred')).toBe(true);
    });
  });

  describe('Rights Revocation', () => {
    it('should throw error when revoking non-existent rights', async () => {
      await expect(
        rightsService.revokeRights('non-existent-content', 'Test reason')
      ).rejects.toThrow('Rights not found');
    });

    it('should record revocation in history', async () => {
      const params = {
        contentId: 'content-revoke-history',
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
      await rightsService.revokeRights('content-revoke-history', 'Policy violation');

      const history = await rightsService.getRightsHistory('content-revoke-history');
      expect(history.some(h => h.action === 'revoked')).toBe(true);
    });
  });

  describe('Campaign Association', () => {
    it('should associate rights with a campaign', async () => {
      const params = {
        contentId: 'content-campaign',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        campaignId: 'campaign-123',
        usageRights: {
          platforms: ['website', 'social'] as const,
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

      expect(rights.campaignId).toBe('campaign-123');
    });

    it('should create rights without campaign association', async () => {
      const params = {
        contentId: 'content-no-campaign',
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

      expect(rights.campaignId).toBeUndefined();
    });
  });

  describe('Platform Restrictions', () => {
    it('should handle all platforms option', async () => {
      const params = {
        contentId: 'content-all-platforms',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['all'] as const,
          territories: ['GLOBAL'],
          duration: 'perpetual' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 100000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.platforms).toContain('all');
    });

    it('should handle broadcast platform', async () => {
      const params = {
        contentId: 'content-broadcast',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['broadcast'] as const,
          territories: ['US'],
          duration: '1_year' as const,
          exclusivity: 'exclusive' as const,
          modifications: 'not_allowed' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 50000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.platforms).toContain('broadcast');
    });

    it('should handle print platform', async () => {
      const params = {
        contentId: 'content-print',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['print'] as const,
          territories: ['US', 'EU'],
          duration: '2_years' as const,
          exclusivity: 'non_exclusive' as const,
          modifications: 'with_approval' as const,
        },
        compensation: {
          type: 'flat_fee' as const,
          amount: 15000,
          currency: 'USD',
        },
      };

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.platforms).toContain('print');
    });

    it('should handle email platform', async () => {
      const params = {
        contentId: 'content-email',
        creatorId: 'creator-456',
        brandId: 'brand-789',
        usageRights: {
          platforms: ['email'] as const,
          territories: ['GLOBAL'],
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

      const rights = await rightsService.createContentRights(params);

      expect(rights.usageRights.platforms).toContain('email');
    });
  });

  describe('Empty History', () => {
    it('should return empty history for non-existent content', async () => {
      const history = await rightsService.getRightsHistory('non-existent-content');
      expect(history).toEqual([]);
    });
  });
});
