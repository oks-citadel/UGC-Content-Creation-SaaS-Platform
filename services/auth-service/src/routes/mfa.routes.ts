import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { mfaService } from '../services/mfa.service';

const router: Router = Router();

// Validation schemas
const verifyTokenSchema = z.object({
  token: z.string().min(6, 'Token must be at least 6 characters'),
});

const verifyMfaSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().min(6, 'Code must be at least 6 characters'),
  method: z.enum(['totp', 'email', 'recovery']).default('totp'),
});

const disableMfaSchema = z.object({
  code: z.string().min(6, 'Code is required'),
  method: z.enum(['totp', 'recovery']).default('totp'),
});

const regenerateCodesSchema = z.object({
  code: z.string().length(6, 'TOTP code must be 6 digits'),
});

// Rate limiters for MFA endpoints
const mfaSetupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 setup attempts per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many MFA setup attempts. Please try again later.',
    },
  },
});

const mfaVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 verification attempts per 5 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many verification attempts. Please wait before trying again.',
    },
  },
});

const strictMfaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour for sensitive operations
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts. Please try again in an hour.',
    },
  },
});

// Helper to validate request body
function validate<TOutput, TInput = unknown>(schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: result.error.errors,
        },
      });
    }
    req.body = result.data;
    next();
  };
}

// Helper to get IP address
function getIpAddress(req: Request): string | undefined {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
}

// Helper to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }
  next();
}

/**
 * POST /api/auth/mfa/setup
 * Initialize MFA setup - generates QR code and secret
 */
router.post('/setup', requireAuth, mfaSetupLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const result = await mfaService.initializeSetup(userId);

    res.json({
      success: true,
      data: {
        qrCode: result.qrCode,
        secret: result.secret,
        otpAuthUrl: result.otpAuthUrl,
        message: 'Scan the QR code with your authenticator app, then verify with a code.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/verify-setup
 * Verify MFA setup and enable TOTP
 */
router.post('/verify-setup', requireAuth, mfaVerifyLimiter, validate(verifyTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { token } = req.body;

    const result = await mfaService.verifySetup(userId, token);

    res.json({
      success: true,
      data: {
        enabled: result.enabled,
        recoveryCodes: result.recoveryCodes,
        message: 'MFA has been enabled. Save your recovery codes in a safe place.',
        warning: 'These recovery codes will only be shown once. Store them securely.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/verify
 * Verify MFA code during login (used after password verification)
 */
router.post('/verify', mfaVerifyLimiter, validate(verifyMfaSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, code, method } = req.body;
    const ipAddress = getIpAddress(req);

    await mfaService.verifyMfa(userId, code, method, ipAddress);

    res.json({
      success: true,
      data: {
        verified: true,
        message: 'MFA verification successful',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/disable
 * Disable MFA (requires current MFA verification)
 */
router.post('/disable', requireAuth, strictMfaLimiter, validate(disableMfaSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { code, method } = req.body;

    await mfaService.disableMfa(userId, code, method);

    res.json({
      success: true,
      message: 'MFA has been disabled. Your account is now less secure.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/mfa/status
 * Get current MFA status for the user
 */
router.get('/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const status = await mfaService.getMfaStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/recovery-codes
 * Generate new recovery codes (requires TOTP verification)
 */
router.post('/recovery-codes', requireAuth, strictMfaLimiter, validate(regenerateCodesSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { code } = req.body;

    const newCodes = await mfaService.regenerateRecoveryCodes(userId, code);

    res.json({
      success: true,
      data: {
        recoveryCodes: newCodes,
        message: 'New recovery codes have been generated. Old codes are now invalid.',
        warning: 'These recovery codes will only be shown once. Store them securely.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/mfa/recovery-codes
 * Get count of remaining recovery codes
 */
router.get('/recovery-codes', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const status = await mfaService.getMfaStatus(userId);

    res.json({
      success: true,
      data: {
        remaining: status.recoveryCodesRemaining,
        total: 10,
        message: status.recoveryCodesRemaining <= 2
          ? 'You have few recovery codes remaining. Consider generating new ones.'
          : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/email-otp/send
 * Send email OTP for verification
 */
router.post('/email-otp/send', mfaSetupLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_USER_ID', message: 'User ID is required' },
      });
    }

    await mfaService.sendEmailOtp(userId);

    res.json({
      success: true,
      message: 'Verification code has been sent to your email.',
      data: {
        expiresInMinutes: 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/mfa/email-otp/enable
 * Enable email OTP as MFA method
 */
router.post('/email-otp/enable', requireAuth, mfaVerifyLimiter, validate(verifyTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { token } = req.body;

    await mfaService.enableEmailOtp(userId, token);

    res.json({
      success: true,
      message: 'Email OTP has been enabled as an MFA method.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
