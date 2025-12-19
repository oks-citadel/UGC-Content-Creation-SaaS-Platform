// =============================================================================
// Auth Service Unit Tests
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/services/auth.service';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import * as passwordLib from '@/lib/password';
import * as jwtLib from '@/lib/jwt';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    verificationCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordReset: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback),
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    setex: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    pipeline: vi.fn(() => ({
      setex: vi.fn(),
      exec: vi.fn(),
    })),
  },
}));

vi.mock('@/lib/password');
vi.mock('@/lib/jwt');
vi.mock('@/lib/mfa');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Mock existing user check (no user exists)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Mock password validation
      vi.mocked(passwordLib.validatePasswordStrength).mockReturnValue({
        valid: true,
        errors: [],
      });

      // Mock password hashing
      vi.mocked(passwordLib.hashPassword).mockResolvedValue('hashed_password');

      // Mock user creation
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        status: 'PENDING',
        role: 'USER',
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      // Mock verification code creation
      vi.mocked(prisma.verificationCode.create).mockResolvedValue({} as any);

      // Mock token generation
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      };
      vi.mocked(jwtLib.generateTokenPair).mockResolvedValue(mockTokens);

      // Mock session creation
      vi.mocked(prisma.session.create).mockResolvedValue({} as any);

      // Mock refresh token storage
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);

      // Mock audit log
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await authService.register(input);

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.firstName).toBe('Test');
      expect(result.tokens).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            passwordHash: 'hashed_password',
          }),
        })
      );
    });

    it('should reject registration if email already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'SecurePass123',
      };

      // Mock existing user
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      } as any);

      await expect(authService.register(input)).rejects.toThrow('Email already registered');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration with weak password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'weak',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(passwordLib.validatePasswordStrength).mockReturnValue({
        valid: false,
        errors: ['Password too weak'],
      });

      await expect(authService.register(input)).rejects.toThrow(
        'Password does not meet requirements'
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        mfaEnabled: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(passwordLib.verifyPassword).mockResolvedValue(true);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      };
      vi.mocked(jwtLib.generateTokenPair).mockResolvedValue(mockTokens);

      vi.mocked(prisma.session.create).mockResolvedValue({} as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await authService.login(input);

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.requiresMfa).toBeUndefined();
    });

    it('should reject login with invalid password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        failedLoginAttempts: 0,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(passwordLib.verifyPassword).mockResolvedValue(false);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await expect(authService.login(input)).rejects.toThrow('Invalid email or password');
    });

    it('should reject login for locked account', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        lockedUntil: new Date(Date.now() + 600000), // Locked for 10 more minutes
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(authService.login(input)).rejects.toThrow('Account is locked');
    });

    it('should require MFA when enabled', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        mfaEnabled: true,
        mfaSecret: 'secret',
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(passwordLib.verifyPassword).mockResolvedValue(true);

      const result = await authService.login(input);

      expect(result.requiresMfa).toBe(true);
      expect(result.tokens.accessToken).toBe('');
    });

    it('should reject login for suspended account', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'SUSPENDED',
        mfaEnabled: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(passwordLib.verifyPassword).mockResolvedValue(true);

      await expect(authService.login(input)).rejects.toThrow('Account is suspended');
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      const token = 'valid_token';
      const payload = {
        sub: 'user-123',
        sessionId: 'session-123',
        email: 'test@example.com',
        role: 'USER',
      };

      vi.mocked(jwtLib.verifyToken).mockResolvedValue(payload as any);
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(redis.setex).mockResolvedValue('OK' as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await authService.logout(token);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { id: payload.sessionId },
      });
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should handle logout with invalid token gracefully', async () => {
      const token = 'invalid_token';

      vi.mocked(jwtLib.verifyToken).mockRejectedValue(new Error('Invalid token'));

      await expect(authService.logout(token)).resolves.not.toThrow();
    });
  });

  describe('refreshTokens', () => {
    it('should successfully refresh tokens', async () => {
      const refreshToken = 'valid_refresh_token';
      const payload = {
        sub: 'user-123',
        type: 'refresh',
        sessionId: 'session-123',
        email: 'test@example.com',
        role: 'USER',
      };

      const storedToken = {
        id: 'token-123',
        token: refreshToken,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        family: 'family-123',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'USER',
        },
      };

      vi.mocked(jwtLib.verifyToken).mockResolvedValue(payload as any);
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(storedToken as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue({} as any);

      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      };
      vi.mocked(jwtLib.generateTokenPair).mockResolvedValue(newTokens);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);

      const result = await authService.refreshTokens(refreshToken);

      expect(result.accessToken).toBe('new_access_token');
      expect(prisma.refreshToken.update).toHaveBeenCalled();
    });

    it('should reject blacklisted refresh tokens', async () => {
      const refreshToken = 'blacklisted_token';
      const payload = {
        sub: 'user-123',
        type: 'refresh',
      };

      vi.mocked(jwtLib.verifyToken).mockResolvedValue(payload as any);
      vi.mocked(redis.get).mockResolvedValue('1');

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should reject expired refresh tokens', async () => {
      const refreshToken = 'expired_token';
      const payload = {
        sub: 'user-123',
        type: 'refresh',
      };

      const storedToken = {
        id: 'token-123',
        token: refreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
        revokedAt: null,
      };

      vi.mocked(jwtLib.verifyToken).mockResolvedValue(payload as any);
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(storedToken as any);

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow(
        'Refresh token expired'
      );
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      const userId = 'user-123';
      const code = 'ABC123';

      const verification = {
        id: 'verification-123',
        userId,
        code,
        type: 'EMAIL',
        usedAt: null,
        expiresAt: new Date(Date.now() + 600000),
      };

      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(verification as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback;
      });
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      vi.mocked(prisma.verificationCode.update).mockResolvedValue({} as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await authService.verifyEmail(userId, code);

      expect(prisma.verificationCode.findFirst).toHaveBeenCalled();
    });

    it('should reject invalid verification code', async () => {
      const userId = 'user-123';
      const code = 'INVALID';

      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

      await expect(authService.verifyEmail(userId, code)).rejects.toThrow(
        'Invalid or expired verification code'
      );
    });
  });
});
