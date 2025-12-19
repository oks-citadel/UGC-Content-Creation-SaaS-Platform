// =============================================================================
// Campaign Lifecycle Integration Tests
// =============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/index';
import { prisma } from '@/lib/prisma';

describe('Campaign Lifecycle Integration Tests', () => {
  let accessToken: string;
  let organizationId: string;
  let userId: string;
  let campaignId: string;

  const testUser = {
    email: 'campaign-test@example.com',
    password: 'TestPassword123',
    firstName: 'Campaign',
    lastName: 'Tester',
  };

  const testCampaign = {
    name: 'Test UGC Campaign',
    description: 'A test campaign for integration testing',
    type: 'UGC',
    budget: 10000,
    currency: 'USD',
    startDate: new Date('2024-06-01').toISOString(),
    endDate: new Date('2024-08-31').toISOString(),
  };

  beforeAll(async () => {
    await prisma.$connect();

    // Create test user and organization
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    accessToken = registerResponse.body.tokens.accessToken;
    userId = registerResponse.body.user.id;

    // Create organization for user
    const orgResponse = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Organization',
        type: 'BRAND',
      })
      .expect(201);

    organizationId = orgResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.campaign.deleteMany({
      where: { organizationId },
    });
    await prisma.organization.deleteMany({
      where: { id: organizationId },
    });
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up campaigns before each test
    await prisma.campaign.deleteMany({
      where: { organizationId },
    });
  });

  describe('Campaign Creation', () => {
    it('should successfully create a campaign', async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCampaign)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testCampaign.name);
      expect(response.body.description).toBe(testCampaign.description);
      expect(response.body.type).toBe(testCampaign.type);
      expect(response.body.budget).toBe(testCampaign.budget.toString());
      expect(response.body.status).toBe('DRAFT');

      campaignId = response.body.id;
    });

    it('should generate unique slug for campaign', async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCampaign)
        .expect(201);

      expect(response.body).toHaveProperty('slug');
      expect(response.body.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should reject campaign creation without authentication', async () => {
      await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .send(testCampaign)
        .expect(401);
    });

    it('should reject campaign creation with invalid data', async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required name field
          description: 'Invalid campaign',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Campaign Retrieval', () => {
    beforeEach(async () => {
      // Create campaign for retrieval tests
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCampaign)
        .expect(201);

      campaignId = response.body.id;
    });

    it('should retrieve a single campaign by ID', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(campaignId);
      expect(response.body.name).toBe(testCampaign.name);
    });

    it('should return 404 for non-existent campaign', async () => {
      await request(app)
        .get(`/api/organizations/${organizationId}/campaigns/non-existent-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should list all campaigns for organization', async () => {
      // Create multiple campaigns
      await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...testCampaign, name: 'Campaign 2' })
        .expect(201);

      const response = await request(app)
        .get(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('should support pagination', async () => {
      // Create multiple campaigns
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`/api/organizations/${organizationId}/campaigns`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...testCampaign, name: `Campaign ${i}` })
          .expect(201);
      }

      const response = await request(app)
        .get(`/api/organizations/${organizationId}/campaigns?page=1&limit=2`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });

    it('should filter campaigns by status', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organizationId}/campaigns?status=DRAFT`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.every((c: any) => c.status === 'DRAFT')).toBe(true);
    });

    it('should filter campaigns by type', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organizationId}/campaigns?type=UGC`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.every((c: any) => c.type === 'UGC')).toBe(true);
    });

    it('should search campaigns by name', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organizationId}/campaigns?search=Test`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Campaign Update', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCampaign)
        .expect(201);

      campaignId = response.body.id;
    });

    it('should successfully update a campaign', async () => {
      const updates = {
        name: 'Updated Campaign Name',
        description: 'Updated description',
        budget: 15000,
      };

      const response = await request(app)
        .patch(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.budget).toBe(updates.budget.toString());
    });

    it('should allow partial updates', async () => {
      const response = await request(app)
        .patch(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Partially Updated' })
        .expect(200);

      expect(response.body.name).toBe('Partially Updated');
      expect(response.body.description).toBe(testCampaign.description);
    });

    it('should update campaign status', async () => {
      const response = await request(app)
        .patch(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });

    it('should reject invalid status transitions', async () => {
      // Try to mark as completed without proper workflow
      const response = await request(app)
        .patch(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Campaign Deletion', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCampaign)
        .expect(201);

      campaignId = response.body.id;
    });

    it('should successfully delete a campaign', async () => {
      await request(app)
        .delete(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify campaign is deleted
      await request(app)
        .get(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent campaign', async () => {
      await request(app)
        .delete(`/api/organizations/${organizationId}/campaigns/non-existent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject deletion without authentication', async () => {
      await request(app)
        .delete(`/api/organizations/${organizationId}/campaigns/${campaignId}`)
        .expect(401);
    });
  });

  describe('Campaign Brief', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCampaign)
        .expect(201);

      campaignId = response.body.id;
    });

    it('should create campaign brief', async () => {
      const brief = {
        overview: 'Campaign overview',
        objectives: { awareness: 80, engagement: 20 },
        targetPlatforms: ['tiktok', 'instagram'],
        contentTypes: ['video', 'image'],
        keyMessages: ['Quality products', 'Affordable prices'],
      };

      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns/${campaignId}/brief`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(brief)
        .expect(201);

      expect(response.body.overview).toBe(brief.overview);
      expect(response.body.targetPlatforms).toEqual(brief.targetPlatforms);
    });

    it('should update campaign brief', async () => {
      // Create brief first
      const brief = {
        overview: 'Initial overview',
      };

      await request(app)
        .post(`/api/organizations/${organizationId}/campaigns/${campaignId}/brief`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(brief)
        .expect(201);

      // Update brief
      const updates = {
        overview: 'Updated overview',
      };

      const response = await request(app)
        .patch(`/api/organizations/${organizationId}/campaigns/${campaignId}/brief`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.overview).toBe(updates.overview);
    });
  });

  describe('Campaign Deliverables', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCampaign)
        .expect(201);

      campaignId = response.body.id;
    });

    it('should add deliverables to campaign', async () => {
      const deliverable = {
        name: 'TikTok Video',
        description: '30-second product showcase',
        type: 'TIKTOK',
        platform: 'tiktok',
        quantity: 3,
        compensation: 500,
      };

      const response = await request(app)
        .post(`/api/organizations/${organizationId}/campaigns/${campaignId}/deliverables`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(deliverable)
        .expect(201);

      expect(response.body.name).toBe(deliverable.name);
      expect(response.body.type).toBe(deliverable.type);
      expect(response.body.quantity).toBe(deliverable.quantity);
    });

    it('should list campaign deliverables', async () => {
      // Add deliverable first
      await request(app)
        .post(`/api/organizations/${organizationId}/campaigns/${campaignId}/deliverables`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Video Content',
          type: 'VIDEO',
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/organizations/${organizationId}/campaigns/${campaignId}/deliverables`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
