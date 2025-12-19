// =============================================================================
// Auth Flow Integration Tests
// =============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/index';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

describe('Auth Flow Integration Tests', () => {
  const testUser = {
    email: 'integration-test@example.com',
    password: 'TestPassword123',
    firstName: 'Integration',
    lastName: 'Test',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    // Ensure database is ready
    await prisma.$connect();
    await redis.ping();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clean up user if exists from previous failed tests
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.firstName).toBe(testUser.firstName);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');

      userId = response.body.user.id;
      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
    });

    it('should reject registration with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email already registered');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: 'weak',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Register user for login tests
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      userId = response.body.user.id;

      // Verify email to activate account
      const verificationCode = await prisma.verificationCode.findFirst({
        where: { userId, type: 'EMAIL', usedAt: null },
      });

      if (verificationCode) {
        await request(app)
          .post('/api/auth/verify-email')
          .send({
            userId,
            code: verificationCode.code,
          })
          .expect(200);
      }
    });

    it('should successfully login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(testUser.email);

      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should lock account after multiple failed login attempts', async () => {
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword',
          });
      }

      // Next attempt should be locked
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(423);

      expect(response.body.error).toContain('Account is locked');
    });
  });

  describe('Token Refresh', () => {
    beforeEach(async () => {
      // Register and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      accessToken = registerResponse.body.tokens.accessToken;
      refreshToken = registerResponse.body.tokens.refreshToken;
    });

    it('should successfully refresh tokens', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(accessToken);
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject reused refresh token', async () => {
      // First refresh
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Second refresh with same token should fail
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toContain('Invalid refresh token');
    });
  });

  describe('User Logout', () => {
    beforeEach(async () => {
      // Register and login
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      accessToken = response.body.tokens.accessToken;
    });

    it('should successfully logout', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should invalidate token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use token after logout
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject logout without token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('Email Verification', () => {
    let verificationCode: string;

    beforeEach(async () => {
      // Register user
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      userId = response.body.user.id;

      // Get verification code from database
      const code = await prisma.verificationCode.findFirst({
        where: { userId, type: 'EMAIL', usedAt: null },
      });

      verificationCode = code!.code;
    });

    it('should successfully verify email', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          userId,
          code: verificationCode,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Check user status updated
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user?.emailVerified).toBe(true);
      expect(user?.status).toBe('ACTIVE');
    });

    it('should reject invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          userId,
          code: 'INVALID',
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid or expired verification code');
    });

    it('should successfully resend verification email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ userId })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Check new code created
      const newCode = await prisma.verificationCode.findFirst({
        where: { userId, type: 'EMAIL', usedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      expect(newCode).toBeDefined();
      expect(newCode?.code).not.toBe(verificationCode);
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      // Register user
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      userId = response.body.user.id;
    });

    it('should request password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Check reset token created
      const resetToken = await prisma.passwordReset.findFirst({
        where: { userId, usedAt: null },
      });

      expect(resetToken).toBeDefined();
    });

    it('should successfully reset password', async () => {
      // Request reset
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      // Get reset token
      const resetRecord = await prisma.passwordReset.findFirst({
        where: { userId, usedAt: null },
      });

      const newPassword = 'NewSecurePass123';

      // Reset password
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetRecord!.token,
          password: newPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Login with new password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);
    });

    it('should reject password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123',
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid or expired reset token');
    });

    it('should not expose whether email exists', async () => {
      // Request reset for non-existent email
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return success to prevent email enumeration
      expect(response.body).toHaveProperty('message');
    });
  });
});
