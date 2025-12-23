import { Router } from 'express';
import { z } from 'zod';
import { ConsentType, DisclosureType, LicenseType } from '@prisma/client';
import { consentService } from '../services/consent.service';
import { gdprService } from '../services/gdpr.service';
import { rightsService } from '../services/rights.service';
import { disclosureService } from '../services/disclosure.service';
import { prisma } from '../lib/prisma';

const router = Router();

// Consent routes
const grantConsentSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(ConsentType),
  purpose: z.string(),
  version: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post('/consent/grant', async (req, res, next) => {
  try {
    const input = grantConsentSchema.parse(req.body);
    const consent = await consentService.grant(input.userId, input.type, input.purpose, input.version, input.ipAddress, input.userAgent, input.metadata);
    res.json({ success: true, data: consent });
  } catch (error) {
    next(error);
  }
});

router.post('/consent/revoke', async (req, res, next) => {
  try {
    const { userId, type } = req.body;
    await consentService.revoke(userId, type);
    res.json({ success: true, data: { message: 'Consent revoked' } });
  } catch (error) {
    next(error);
  }
});

router.get('/consent/check/:userId/:type', async (req, res, next) => {
  try {
    const { userId, type } = req.params;
    const hasConsent = await consentService.check(userId, type as ConsentType);
    res.json({ success: true, data: { hasConsent } });
  } catch (error) {
    next(error);
  }
});

router.get('/consent/user/:userId', async (req, res, next) => {
  try {
    const consents = await consentService.getAll(req.params.userId);
    res.json({ success: true, data: consents });
  } catch (error) {
    next(error);
  }
});

// GDPR routes
router.post('/gdpr/export', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const requestId = await gdprService.requestDataExport(userId);
    res.json({ success: true, data: { requestId, message: 'Data export requested' } });
  } catch (error) {
    next(error);
  }
});

router.post('/gdpr/delete', async (req, res, next) => {
  try {
    const { userId, notes } = req.body;
    const requestId = await gdprService.requestDataDeletion(userId, notes);
    res.json({ success: true, data: { requestId, message: 'Data deletion requested' } });
  } catch (error) {
    next(error);
  }
});

router.post('/gdpr/delete/:requestId/process', async (req, res, next) => {
  try {
    await gdprService.processDataDeletion(req.params.requestId);
    res.json({ success: true, data: { message: 'Data deletion processed' } });
  } catch (error) {
    next(error);
  }
});

router.get('/gdpr/requests/:userId', async (req, res, next) => {
  try {
    const requests = await prisma.dataRequest.findMany({
      where: { userId: req.params.userId },
      orderBy: { requestedAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});

// Content rights routes
const createRightsSchema = z.object({
  contentId: z.string().uuid(),
  creatorId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  licenseType: z.nativeEnum(LicenseType),
  usageRights: z.array(z.string()),
  territory: z.array(z.string()),
  duration: z.string().optional(),
  exclusivity: z.boolean().optional(),
  canModify: z.boolean().optional(),
  canResell: z.boolean().optional(),
  attribution: z.string().optional(),
  restrictions: z.record(z.any()).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  documentUrl: z.string().url().optional(),
});

router.post('/rights', async (req, res, next) => {
  try {
    const input = createRightsSchema.parse(req.body);
    const rights = await rightsService.createContentRights({
      ...input,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    } as any);
    res.json({ success: true, data: rights });
  } catch (error) {
    next(error);
  }
});

router.get('/rights/content/:contentId', async (req, res, next) => {
  try {
    const rights = await rightsService.getContentRights(req.params.contentId);
    res.json({ success: true, data: rights });
  } catch (error) {
    next(error);
  }
});

router.post('/rights/:rightsId/transfer', async (req, res, next) => {
  try {
    const { newBrandId } = req.body;
    const rights = await rightsService.transferRights(req.params.rightsId, newBrandId);
    res.json({ success: true, data: rights });
  } catch (error) {
    next(error);
  }
});

router.post('/rights/:rightsId/revoke', async (req, res, next) => {
  try {
    const rights = await rightsService.revokeRights(req.params.rightsId);
    res.json({ success: true, data: rights });
  } catch (error) {
    next(error);
  }
});

router.get('/rights/verify/:contentId/:brandId/:usageType', async (req, res, next) => {
  try {
    const { contentId, brandId, usageType } = req.params;
    const hasRights = await rightsService.verifyRights(contentId, brandId, usageType);
    res.json({ success: true, data: { hasRights } });
  } catch (error) {
    next(error);
  }
});

// Disclosure routes
const createDisclosureSchema = z.object({
  contentId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(DisclosureType),
  platform: z.string(),
  text: z.string(),
  metadata: z.record(z.any()).optional(),
});

router.post('/disclosure', async (req, res, next) => {
  try {
    const input = createDisclosureSchema.parse(req.body);
    const disclosure = await disclosureService.createDisclosure(input.contentId, input.userId, input.type, input.platform, input.text, input.metadata);
    res.json({ success: true, data: disclosure });
  } catch (error) {
    next(error);
  }
});

router.post('/disclosure/:disclosureId/review', async (req, res, next) => {
  try {
    const { reviewedBy, isCompliant, notes } = req.body;
    const disclosure = await disclosureService.reviewDisclosure(req.params.disclosureId, reviewedBy, isCompliant, notes);
    res.json({ success: true, data: disclosure });
  } catch (error) {
    next(error);
  }
});

router.get('/disclosure/content/:contentId', async (req, res, next) => {
  try {
    const disclosures = await disclosureService.getContentDisclosures(req.params.contentId);
    res.json({ success: true, data: disclosures });
  } catch (error) {
    next(error);
  }
});

router.get('/disclosure/non-compliant', async (req, res, next) => {
  try {
    const { userId } = req.query;
    const disclosures = await disclosureService.getNonCompliantDisclosures(userId as string);
    res.json({ success: true, data: disclosures });
  } catch (error) {
    next(error);
  }
});

router.post('/disclosure/check-compliance', async (req, res, next) => {
  try {
    const { platform, text, type } = req.body;
    const isCompliant = disclosureService.checkCompliance(platform, text, type);
    res.json({ success: true, data: { isCompliant } });
  } catch (error) {
    next(error);
  }
});

router.post('/disclosure/generate', async (req, res, next) => {
  try {
    const { type, platform } = req.body;
    const text = await disclosureService.generateDisclosureText(type, platform);
    res.json({ success: true, data: { text } });
  } catch (error) {
    next(error);
  }
});

// Audit log routes
router.post('/audit', async (req, res, next) => {
  try {
    const { userId, action, resource, resourceId, changes, ipAddress, userAgent, metadata } = req.body;
    const log = await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, changes, ipAddress, userAgent, metadata },
    });
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
});

router.get('/audit/:userId', async (req, res, next) => {
  try {
    const { page = '1', limit = '50', resource } = req.query;
    const where: any = { userId: req.params.userId };
    if (resource) where.resource = resource;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
