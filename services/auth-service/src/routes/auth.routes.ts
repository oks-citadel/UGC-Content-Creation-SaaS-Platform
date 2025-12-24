import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const router: Router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaToken: z.string().optional(),
  mfaMethod: z.enum(['totp', 'email', 'recovery']).optional().default('totp'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const mfaVerifySchema = z.object({
  token: z.string().length(6, 'MFA token must be 6 digits'),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const verifyEmailSchema = z.object({
  code: z.string().min(1, 'Verification code is required'),
});

// Helper to get IP address
function getIpAddress(req: Request): string | undefined {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress;
}

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

// POST /auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login({
      ...req.body,
      ipAddress: getIpAddress(req),
      userAgent: req.headers['user-agent'],
    });

    if (result.requiresMfa) {
      return res.status(200).json({
        success: true,
        data: {
          requiresMfa: true,
          userId: result.user.id,
          mfaMethods: result.mfaMethods,
        },
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await authService.logout(token);
    }
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/refresh
router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/mfa/setup
router.post('/mfa/setup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const result = await authService.setupMfa(userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/mfa/enable
router.post('/mfa/enable', validate(mfaVerifySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await authService.enableMfa(userId, req.body.token);
    res.json({
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/mfa/disable
router.post('/mfa/disable', validate(mfaVerifySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await authService.disableMfa(userId, req.body.token);
    res.json({
      success: true,
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/password/forgot
router.post('/password/forgot', validate(passwordResetRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/password/reset
router.post('/password/reset', validate(passwordResetSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/email/verify
router.post('/email/verify', validate(verifyEmailSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await authService.verifyEmail(userId, req.body.code);
    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/email/resend
router.post('/email/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await authService.resendVerificationEmail(userId);
    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
});

// GET /auth/sessions
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const sessions = await authService.getSessions(userId);
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /auth/sessions/:sessionId
router.delete('/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await authService.revokeSession(userId, req.params.sessionId);
    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /auth/sessions
router.delete('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const currentSessionId = req.headers['x-session-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    await authService.revokeAllSessions(userId, currentSessionId);
    res.json({
      success: true,
      message: 'All other sessions revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
