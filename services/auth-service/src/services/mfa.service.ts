import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import {
  setupMfa as setupMfaData,
  setupRecoveryCodes,
  verifyToken as verifyTotpToken,
  verifyRecoveryCode,
  generateEmailOtp,
  getEmailOtpExpiry,
  isEmailOtpExpired,
  encryptSecret,
  decryptSecret,
  hashRecoveryCode,
} from '../lib/mfa';
import { AppError } from '../lib/errors';
import { MfaMethod } from '@prisma/client';

// Constants
const MFA_SETUP_EXPIRY = 600; // 10 minutes
const MFA_VERIFY_ATTEMPTS_KEY = 'mfa:attempts:';
const MAX_MFA_ATTEMPTS = 5;
const MFA_LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

export interface MfaSetupResponse {
  qrCode: string;
  secret: string;
  otpAuthUrl: string;
}

export interface MfaVerifySetupResponse {
  enabled: boolean;
  recoveryCodes: string[];
}

export interface MfaStatusResponse {
  mfaEnabled: boolean;
  totpEnabled: boolean;
  emailOtpEnabled: boolean;
  preferredMethod: MfaMethod | null;
  recoveryCodesRemaining: number;
}

class MfaService {
  /**
   * Initialize MFA setup - generate secret and QR code
   */
  async initializeSetup(userId: string): Promise<MfaSetupResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaConfig: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.mfaConfig?.totpEnabled) {
      throw new AppError('TOTP MFA is already enabled', 400);
    }

    // Generate MFA setup data
    const mfaData = await setupMfaData(user.email);

    // Store secret temporarily in Redis with expiry
    await redis.setex(
      `mfa_setup:${userId}`,
      MFA_SETUP_EXPIRY,
      JSON.stringify({
        secret: mfaData.secret,
        encryptedSecret: mfaData.encryptedSecret,
      })
    );

    return {
      qrCode: mfaData.qrCode,
      secret: mfaData.secret,
      otpAuthUrl: mfaData.otpAuthUrl,
    };
  }

  /**
   * Verify MFA setup and enable TOTP
   */
  async verifySetup(userId: string, token: string): Promise<MfaVerifySetupResponse> {
    // Get temporary secret from Redis
    const setupData = await redis.get(`mfa_setup:${userId}`);

    if (!setupData) {
      throw new AppError('MFA setup expired. Please start again.', 400);
    }

    const { secret, encryptedSecret } = JSON.parse(setupData);

    // Verify the token
    if (!verifyTotpToken(token, secret)) {
      throw new AppError('Invalid verification code', 401);
    }

    // Generate recovery codes
    const recoveryCodeSetup = await setupRecoveryCodes();

    // Create or update MFA config
    await prisma.$transaction(async (tx) => {
      const existingConfig = await tx.mfaConfig.findUnique({
        where: { userId },
      });

      if (existingConfig) {
        // Update existing config
        await tx.mfaConfig.update({
          where: { userId },
          data: {
            totpSecret: encryptedSecret,
            totpEnabled: true,
            preferredMethod: 'TOTP',
          },
        });

        // Delete old recovery codes
        await tx.recoveryCode.deleteMany({
          where: { mfaConfigId: existingConfig.id },
        });

        // Create new recovery codes
        await tx.recoveryCode.createMany({
          data: recoveryCodeSetup.hashedCodes.map((codeHash) => ({
            mfaConfigId: existingConfig.id,
            codeHash,
          })),
        });
      } else {
        // Create new config with recovery codes
        await tx.mfaConfig.create({
          data: {
            userId,
            totpSecret: encryptedSecret,
            totpEnabled: true,
            preferredMethod: 'TOTP',
            recoveryCodes: {
              create: recoveryCodeSetup.hashedCodes.map((codeHash) => ({
                codeHash,
              })),
            },
          },
        });
      }

      // Update user's mfaEnabled flag
      await tx.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaSecret: encryptedSecret, // Keep for backward compatibility
        },
      });
    });

    // Clean up Redis
    await redis.del(`mfa_setup:${userId}`);

    // Log audit event
    await this.logMfaAudit(userId, 'MFA_TOTP_ENABLED');

    return {
      enabled: true,
      recoveryCodes: recoveryCodeSetup.plainCodes,
    };
  }

  /**
   * Verify MFA during login
   */
  async verifyMfa(
    userId: string,
    code: string,
    method: 'totp' | 'email' | 'recovery',
    ipAddress?: string
  ): Promise<boolean> {
    // Check rate limit
    await this.checkRateLimit(userId, ipAddress);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mfaConfig: {
          include: {
            recoveryCodes: {
              where: { usedAt: null },
            },
          },
        },
      },
    });

    if (!user || !user.mfaConfig) {
      await this.recordAttempt(userId, false, method as MfaMethod, ipAddress);
      throw new AppError('MFA not configured', 400);
    }

    let isValid = false;

    switch (method) {
      case 'totp':
        isValid = await this.verifyTotpCode(user.mfaConfig.totpSecret, code);
        break;
      case 'email':
        isValid = await this.verifyEmailOtpCode(userId, code);
        break;
      case 'recovery':
        isValid = await this.verifyAndConsumeRecoveryCode(user.mfaConfig.id, code);
        break;
      default:
        throw new AppError('Invalid MFA method', 400);
    }

    await this.recordAttempt(userId, isValid, method.toUpperCase() as MfaMethod, ipAddress);

    if (!isValid) {
      throw new AppError('Invalid verification code', 401);
    }

    // Clear rate limit on success
    await this.clearRateLimit(userId);

    return true;
  }

  /**
   * Disable MFA (requires current MFA verification)
   */
  async disableMfa(userId: string, code: string, method: 'totp' | 'recovery'): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaConfig: true },
    });

    if (!user || !user.mfaConfig || !user.mfaEnabled) {
      throw new AppError('MFA is not enabled', 400);
    }

    // Verify the code first
    await this.verifyMfa(userId, code, method);

    // Disable MFA
    await prisma.$transaction([
      prisma.mfaConfig.delete({
        where: { userId },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
        },
      }),
    ]);

    await this.logMfaAudit(userId, 'MFA_DISABLED');
  }

  /**
   * Get MFA status for a user
   */
  async getMfaStatus(userId: string): Promise<MfaStatusResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mfaConfig: {
          include: {
            recoveryCodes: {
              where: { usedAt: null },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      mfaEnabled: user.mfaEnabled,
      totpEnabled: user.mfaConfig?.totpEnabled ?? false,
      emailOtpEnabled: user.mfaConfig?.emailOtpEnabled ?? false,
      preferredMethod: user.mfaConfig?.preferredMethod ?? null,
      recoveryCodesRemaining: user.mfaConfig?.recoveryCodes.length ?? 0,
    };
  }

  /**
   * Generate new recovery codes
   */
  async regenerateRecoveryCodes(userId: string, code: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaConfig: true },
    });

    if (!user || !user.mfaConfig) {
      throw new AppError('MFA is not enabled', 400);
    }

    // Verify current code first
    await this.verifyMfa(userId, code, 'totp');

    // Generate new recovery codes
    const recoveryCodeSetup = await setupRecoveryCodes();

    // Replace old codes with new ones
    await prisma.$transaction([
      prisma.recoveryCode.deleteMany({
        where: { mfaConfigId: user.mfaConfig.id },
      }),
      prisma.recoveryCode.createMany({
        data: recoveryCodeSetup.hashedCodes.map((codeHash) => ({
          mfaConfigId: user.mfaConfig!.id,
          codeHash,
        })),
      }),
    ]);

    await this.logMfaAudit(userId, 'MFA_RECOVERY_CODES_REGENERATED');

    return recoveryCodeSetup.plainCodes;
  }

  /**
   * Send email OTP for verification
   */
  async sendEmailOtp(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaConfig: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate OTP
    const otp = generateEmailOtp();
    const expiresAt = getEmailOtpExpiry();

    // Store in database
    await prisma.verificationCode.create({
      data: {
        userId,
        code: otp,
        type: 'EMAIL_OTP',
        expiresAt,
      },
    });

    // Store in Redis for quick lookup
    await redis.setex(
      `email_otp:${userId}`,
      10 * 60, // 10 minutes
      otp
    );

    // TODO: Send email via notification service
    // For now, log it (remove in production)
    console.log(`[MFA] Email OTP for user ${userId}: ${otp}`);

    await this.logMfaAudit(userId, 'MFA_EMAIL_OTP_SENT');
  }

  /**
   * Enable email OTP as MFA method
   */
  async enableEmailOtp(userId: string, code: string): Promise<void> {
    // Verify the email OTP first
    const isValid = await this.verifyEmailOtpCode(userId, code);

    if (!isValid) {
      throw new AppError('Invalid email OTP', 401);
    }

    await prisma.$transaction(async (tx) => {
      let mfaConfig = await tx.mfaConfig.findUnique({
        where: { userId },
      });

      if (!mfaConfig) {
        // Create new MFA config
        const recoveryCodeSetup = await setupRecoveryCodes();

        mfaConfig = await tx.mfaConfig.create({
          data: {
            userId,
            emailOtpEnabled: true,
            preferredMethod: 'EMAIL_OTP',
            recoveryCodes: {
              create: recoveryCodeSetup.hashedCodes.map((codeHash) => ({
                codeHash,
              })),
            },
          },
        });
      } else {
        await tx.mfaConfig.update({
          where: { userId },
          data: {
            emailOtpEnabled: true,
          },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });
    });

    await this.logMfaAudit(userId, 'MFA_EMAIL_OTP_ENABLED');
  }

  // Private helper methods

  private async verifyTotpCode(encryptedSecret: string | null, code: string): Promise<boolean> {
    if (!encryptedSecret) {
      return false;
    }

    try {
      const secret = decryptSecret(encryptedSecret);
      return verifyTotpToken(code, secret);
    } catch {
      return false;
    }
  }

  private async verifyEmailOtpCode(userId: string, code: string): Promise<boolean> {
    // Check Redis first for performance
    const cachedOtp = await redis.get(`email_otp:${userId}`);
    if (cachedOtp === code) {
      await redis.del(`email_otp:${userId}`);
      return true;
    }

    // Fallback to database
    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId,
        code,
        type: 'EMAIL_OTP',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return false;
    }

    // Mark as used
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  private async verifyAndConsumeRecoveryCode(mfaConfigId: string, code: string): Promise<boolean> {
    const recoveryCodes = await prisma.recoveryCode.findMany({
      where: {
        mfaConfigId,
        usedAt: null,
      },
    });

    for (const recoveryCode of recoveryCodes) {
      const isMatch = await verifyRecoveryCode(code, recoveryCode.codeHash);
      if (isMatch) {
        // Mark as used
        await prisma.recoveryCode.update({
          where: { id: recoveryCode.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }

  private async checkRateLimit(userId: string, ipAddress?: string): Promise<void> {
    const key = `${MFA_VERIFY_ATTEMPTS_KEY}${userId}`;
    const attempts = await redis.get(key);

    if (attempts && parseInt(attempts, 10) >= MAX_MFA_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      throw new AppError(
        `Too many verification attempts. Please try again in ${Math.ceil(ttl / 60)} minutes`,
        429
      );
    }
  }

  private async recordAttempt(
    userId: string,
    success: boolean,
    method: MfaMethod,
    ipAddress?: string
  ): Promise<void> {
    // Record in database for audit
    await prisma.mfaAttempt.create({
      data: {
        userId,
        success,
        method,
        ipAddress,
      },
    });

    // Track failed attempts in Redis for rate limiting
    if (!success) {
      const key = `${MFA_VERIFY_ATTEMPTS_KEY}${userId}`;
      const currentAttempts = await redis.incr(key);

      if (currentAttempts === 1) {
        await redis.expire(key, MFA_LOCKOUT_DURATION);
      }
    }
  }

  private async clearRateLimit(userId: string): Promise<void> {
    await redis.del(`${MFA_VERIFY_ATTEMPTS_KEY}${userId}`);
  }

  private async logMfaAudit(userId: string, action: string, metadata?: Record<string, unknown>): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata: metadata as never,
      },
    });
  }
}

export const mfaService = new MfaService();
