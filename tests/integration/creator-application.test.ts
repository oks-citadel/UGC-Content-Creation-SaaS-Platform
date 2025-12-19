// =============================================================================
// Creator Application Integration Tests
// =============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/index';
import { prisma } from '@/lib/prisma';

describe('Creator Application Integration Tests', () => {
  let brandAccessToken: string;
  let creatorAccessToken: string;
  let brandOrgId: string;
  let creatorOrgId: string;
  let campaignId: string;
  let applicationId: string;

  const brandUser = {
    email: 'brand@example.com',
    password: 'BrandPass123',
    firstName: 'Brand',
    lastName: 'User',
  };

  const creatorUser = {
    email: 'creator@example.com',
    password: 'CreatorPass123',
    firstName: 'Creator',
    lastName: 'User',
  };

  beforeAll(async () => {
    await prisma.$connect();

    // Create brand user
    const brandResponse = await request(app)
      .post('/api/auth/register')
      .send(brandUser)
      .expect(201);

    brandAccessToken = brandResponse.body.tokens.accessToken;

    // Create brand organization
    const brandOrgResponse = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${brandAccessToken}`)
      .send({
        name: 'Test Brand',
        type: 'BRAND',
      })
      .expect(201);

    brandOrgId = brandOrgResponse.body.id;

    // Create campaign
    const campaignResponse = await request(app)
      .post(`/api/organizations/${brandOrgId}/campaigns`)
      .set('Authorization', `Bearer ${brandAccessToken}`)
      .send({
        name: 'Test Campaign',
        description: 'Campaign for creator applications',
        type: 'UGC',
        status: 'ACTIVE',
      })
      .expect(201);

    campaignId = campaignResponse.body.id;

    // Create creator user
    const creatorResponse = await request(app)
      .post('/api/auth/register')
      .send(creatorUser)
      .expect(201);

    creatorAccessToken = creatorResponse.body.tokens.accessToken;

    // Create creator organization/profile
    const creatorOrgResponse = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${creatorAccessToken}`)
      .send({
        name: 'Creator Profile',
        type: 'CREATOR',
      })
      .expect(201);

    creatorOrgId = creatorOrgResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.application.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: [brandUser.email, creatorUser.email] },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up applications before each test
    await prisma.application.deleteMany({
      where: { campaignId },
    });
  });

  describe('Creator Application Submission', () => {
    it('should allow creator to apply to campaign', async () => {
      const application = {
        message: 'I would love to create content for your brand!',
        proposedRate: 500,
        estimatedDeliveryDays: 7,
        portfolio: [
          {
            title: 'Previous Work',
            url: 'https://tiktok.com/@creator/video/123',
            platform: 'tiktok',
          },
        ],
      };

      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send(application)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe(application.message);
      expect(response.body.proposedRate).toBe(application.proposedRate.toString());
      expect(response.body.status).toBe('PENDING');

      applicationId = response.body.id;
    });

    it('should reject duplicate applications from same creator', async () => {
      // First application
      await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          message: 'First application',
        })
        .expect(201);

      // Second application should fail
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          message: 'Second application',
        })
        .expect(409);

      expect(response.body.error).toContain('already applied');
    });

    it('should reject application without authentication', async () => {
      await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .send({
          message: 'Unauthenticated application',
        })
        .expect(401);
    });

    it('should reject application with invalid data', async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          // Missing message
          proposedRate: -100, // Invalid negative rate
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Application Management by Brand', () => {
    beforeEach(async () => {
      // Create application for testing
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          message: 'Test application',
          proposedRate: 500,
        })
        .expect(201);

      applicationId = response.body.id;
    });

    it('should allow brand to view all applications for their campaign', async () => {
      const response = await request(app)
        .get(`/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should allow brand to approve application', async () => {
      const response = await request(app)
        .patch(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications/${applicationId}`
        )
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .send({ status: 'APPROVED' })
        .expect(200);

      expect(response.body.status).toBe('APPROVED');
    });

    it('should allow brand to reject application', async () => {
      const response = await request(app)
        .patch(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications/${applicationId}`
        )
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .send({
          status: 'REJECTED',
          rejectionReason: 'Not a good fit at this time',
        })
        .expect(200);

      expect(response.body.status).toBe('REJECTED');
      expect(response.body.rejectionReason).toBeDefined();
    });

    it('should reject application status update by non-brand user', async () => {
      await request(app)
        .patch(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications/${applicationId}`
        )
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({ status: 'APPROVED' })
        .expect(403);
    });
  });

  describe('Application Withdrawal by Creator', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          message: 'Test application',
        })
        .expect(201);

      applicationId = response.body.id;
    });

    it('should allow creator to withdraw pending application', async () => {
      const response = await request(app)
        .delete(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .expect(200);

      expect(response.body.status).toBe('WITHDRAWN');
    });

    it('should reject withdrawal of approved application', async () => {
      // Brand approves application
      await request(app)
        .patch(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications/${applicationId}`
        )
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .send({ status: 'APPROVED' })
        .expect(200);

      // Creator tries to withdraw
      const response = await request(app)
        .delete(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot withdraw approved application');
    });
  });

  describe('Application Filtering and Search', () => {
    beforeEach(async () => {
      // Create multiple applications with different statuses
      const application1 = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          message: 'Application 1',
          proposedRate: 500,
        })
        .expect(201);

      applicationId = application1.body.id;
    });

    it('should filter applications by status', async () => {
      const response = await request(app)
        .get(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications?status=PENDING`
        )
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .expect(200);

      expect(response.body.data.every((app: any) => app.status === 'PENDING')).toBe(true);
    });

    it('should support pagination for applications', async () => {
      const response = await request(app)
        .get(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications?page=1&limit=10`
        )
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('Application Details', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          message: 'Detailed application',
          proposedRate: 750,
          estimatedDeliveryDays: 10,
          portfolio: [
            {
              title: 'Sample Work 1',
              url: 'https://example.com/work1',
            },
          ],
        })
        .expect(201);

      applicationId = response.body.id;
    });

    it('should retrieve full application details', async () => {
      const response = await request(app)
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .expect(200);

      expect(response.body.id).toBe(applicationId);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('proposedRate');
      expect(response.body).toHaveProperty('portfolio');
    });

    it('should include creator profile in application', async () => {
      const response = await request(app)
        .get(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications/${applicationId}`
        )
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('creator');
      expect(response.body.creator).toHaveProperty('id');
    });
  });

  describe('Application Notifications', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/campaigns/${campaignId}/applications`)
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .send({
          message: 'Application for notification test',
        })
        .expect(201);

      applicationId = response.body.id;
    });

    it('should create notification when application is submitted', async () => {
      // Check brand user has notification
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .expect(200);

      const applicationNotification = response.body.data.find(
        (n: any) => n.type === 'NEW_APPLICATION' && n.metadata?.applicationId === applicationId
      );

      expect(applicationNotification).toBeDefined();
    });

    it('should create notification when application is approved', async () => {
      // Brand approves
      await request(app)
        .patch(
          `/api/organizations/${brandOrgId}/campaigns/${campaignId}/applications/${applicationId}`
        )
        .set('Authorization', `Bearer ${brandAccessToken}`)
        .send({ status: 'APPROVED' })
        .expect(200);

      // Check creator has notification
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${creatorAccessToken}`)
        .expect(200);

      const approvalNotification = response.body.data.find(
        (n: any) =>
          n.type === 'APPLICATION_APPROVED' && n.metadata?.applicationId === applicationId
      );

      expect(approvalNotification).toBeDefined();
    });
  });
});
