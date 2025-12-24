import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/password';
import { generateTokenPair, verifyToken, TokenPair } from '../lib/jwt';
import { setupMfa, verifyToken as verifyMfaToken, decryptSecret } from '../lib/mfa';
import { mfaService } from './mfa.service';
import { config } from '../config';
import { AppError, ValidationError } from '../lib/errors';
import { NotificationClient } from '@nexus/utils';

const notificationClient = new NotificationClient();

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  mfaToken?: string;
  mfaMethod?: 'totp' | 'email' | 'recovery';
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    mfaEnabled: boolean;
  };
  tokens: TokenPair;
  requiresMfa?: boolean;
  mfaMethods?: string[];
}

class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, password, firstName, lastName } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password does not meet requirements', passwordValidation.errors);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        status: 'PENDING',
        role: 'USER',
      },
    });

    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: verificationCode,
        type: 'EMAIL',
        expiresAt: new Date(Date.now() + config.email.verificationExpiry),
      },
    });

    // Create session
    const sessionId = uuidv4();
    const tokens = await generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    // Store session
    await this.createSession(user.id, sessionId, tokens.refreshTokenExpiresAt);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    // Log audit event
    await this.logAudit(user.id, 'USER_REGISTERED');

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password, mfaToken, mfaMethod = 'totp', ipAddress, userAgent } = input;

    // Find user with MFA config
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { mfaConfig: true },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account is locked. Try again in ${remainingTime} minutes`, 423);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= config.password.maxLoginAttempts) {
        updateData.lockedUntil = new Date(Date.now() + config.password.lockoutDuration);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await this.logAudit(user.id, 'LOGIN_FAILED', { ipAddress, reason: 'invalid_password' });
      throw new AppError('Invalid email or password', 401);
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      if (!mfaToken) {
        // Return partial response indicating MFA is required
        // Include available MFA methods
        const mfaMethods: string[] = [];
        if (user.mfaConfig?.totpEnabled) mfaMethods.push('totp');
        if (user.mfaConfig?.emailOtpEnabled) mfaMethods.push('email');
        // Recovery codes are always available if MFA is enabled
        mfaMethods.push('recovery');

        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            mfaEnabled: user.mfaEnabled,
          },
          tokens: {
            accessToken: '',
            refreshToken: '',
            accessTokenExpiresAt: new Date(),
            refreshTokenExpiresAt: new Date(),
          },
          requiresMfa: true,
          mfaMethods,
        };
      }

      // Verify MFA using the new MFA service
      try {
        await mfaService.verifyMfa(user.id, mfaToken, mfaMethod, ipAddress);
      } catch (error) {
        await this.logAudit(user.id, 'LOGIN_FAILED', { ipAddress, reason: 'invalid_mfa', method: mfaMethod });
        throw error;
      }
    }

    // Check user status
    if (user.status === 'SUSPENDED') {
      throw new AppError('Account is suspended', 403);
    }

    if (user.status === 'DELETED') {
      throw new AppError('Account not found', 404);
    }

    // Reset failed login attempts and update login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Create session
    const sessionId = uuidv4();
    const tokens = await generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    // Store session
    await this.createSession(user.id, sessionId, tokens.refreshTokenExpiresAt, ipAddress, userAgent);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    // Log audit event
    await this.logAudit(user.id, 'LOGIN_SUCCESS', { ipAddress });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  async logout(token: string): Promise<void> {
    try {
      const payload = await verifyToken(token);

      // Invalidate session
      await prisma.session.deleteMany({
        where: { id: payload.sessionId },
      });

      // Add token to blacklist
      await redis.setex(`blacklist:${token}`, 86400, '1');

      await this.logAudit(payload.sub, 'LOGOUT');
    } catch {
      // Token might already be invalid, that's okay
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401);
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token expired', 401);
    }

    // Revoke old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new token pair
    const tokens = await generateTokenPair({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      sessionId: payload.sessionId,
    });

    // Store new refresh token
    await this.storeRefreshToken(
      storedToken.user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt,
      storedToken.family
    );

    return tokens;
  }

  async setupMfa(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.mfaEnabled) {
      throw new AppError('MFA is already enabled', 400);
    }

    const mfaData = await setupMfa(user.email);

    // Store secret temporarily in Redis (user must verify before enabling)
    await redis.setex(`mfa_setup:${userId}`, 600, mfaData.secret);

    return {
      qrCode: mfaData.qrCode,
      secret: mfaData.secret,
    };
  }

  async enableMfa(userId: string, token: string): Promise<void> {
    // Get temporary secret from Redis
    const secret = await redis.get(`mfa_setup:${userId}`);

    if (!secret) {
      throw new AppError('MFA setup expired. Please start again.', 400);
    }

    // Verify token
    if (!verifyMfaToken(token, secret)) {
      throw new AppError('Invalid MFA token', 401);
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
      },
    });

    // Clean up Redis
    await redis.del(`mfa_setup:${userId}`);

    await this.logAudit(userId, 'MFA_ENABLED');
  }

  async disableMfa(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new AppError('MFA is not enabled', 400);
    }

    if (!verifyMfaToken(token, user.mfaSecret)) {
      throw new AppError('Invalid MFA token', 401);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    await this.logAudit(userId, 'MFA_DISABLED');
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + config.password.resetExpiry),
      },
    });

    // Send password reset email via notification service
    try {
      await notificationClient.sendPasswordResetEmail({
        email: user.email,
        resetToken,
        userName: user.firstName || undefined,
        expiresIn: '1 hour',
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw - token was created, user can request again if email fails
    }

    await this.logAudit(user.id, 'PASSWORD_RESET_REQUESTED');
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest || resetRequest.usedAt || resetRequest.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Validate password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      throw new ValidationError('Password does not meet requirements', validation.errors);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all sessions
      prisma.session.deleteMany({
        where: { userId: resetRequest.userId },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: resetRequest.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.logAudit(resetRequest.userId, 'PASSWORD_RESET_COMPLETED');
  }

  async verifyEmail(userId: string, code: string): Promise<void> {
    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId,
        code,
        type: 'EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          status: 'ACTIVE',
        },
      }),
      prisma.verificationCode.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.logAudit(userId, 'EMAIL_VERIFIED');
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Invalidate existing codes
    await prisma.verificationCode.updateMany({
      where: { userId, type: 'EMAIL', usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate new code
    const code = this.generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        userId,
        code,
        type: 'EMAIL',
        expiresAt: new Date(Date.now() + config.email.verificationExpiry),
      },
    });

    // Send verification email via notification service
    try {
      await notificationClient.sendVerificationEmail({
        email: user.email,
        verificationCode: code,
        userName: user.firstName || undefined,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw - code was created, user can request again if email fails
    }

    await this.logAudit(userId, 'VERIFICATION_EMAIL_RESENT');
  }

  async getSessions(userId: string): Promise<Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    lastActiveAt: Date;
  }>> {
    return prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastActiveAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    // Blacklist the session token
    await redis.setex(`blacklist:session:${sessionId}`, 86400, '1');

    await this.logAudit(userId, 'SESSION_REVOKED', { sessionId });
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const where = exceptSessionId
      ? { userId, id: { not: exceptSessionId } }
      : { userId };

    const sessions = await prisma.session.findMany({ where, select: { id: true } });

    await prisma.session.deleteMany({ where });

    // Blacklist all session tokens
    const pipeline = redis.pipeline();
    for (const session of sessions) {
      pipeline.setex(`blacklist:session:${session.id}`, 86400, '1');
    }
    await pipeline.exec();

    await this.logAudit(userId, 'ALL_SESSIONS_REVOKED');
  }

  private async createSession(
    userId: string,
    sessionId: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token: uuidv4(),
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    family?: string
  ): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        family: family || uuidv4(),
        expiresAt,
      },
    });
  }

  private async logAudit(
    userId: string | null,
    action: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata: metadata as never,
      },
    });
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const authService = new AuthService();
