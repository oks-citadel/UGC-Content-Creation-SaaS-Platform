import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';

const router: Router = Router();

// Validation schemas
const updateUserSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  phoneNumber: z.string().max(20).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

const updateProfileSchema = z.object({
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterHandle: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  weekStartsOn: z.number().min(0).max(6).optional(),
  compactMode: z.boolean().optional(),
  sidebarCollapsed: z.boolean().optional(),
});

const updateNotificationSettingsSchema = z.object({
  emailMarketing: z.boolean().optional(),
  emailProductUpdates: z.boolean().optional(),
  emailCampaignUpdates: z.boolean().optional(),
  emailCreatorMessages: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().max(100).optional(),
  size: z.enum(['SOLO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
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

// GET /users/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const user = await userService.getUserById(userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me
router.patch('/me', requireAuth, validate(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const user = await userService.updateUser(userId, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// DELETE /users/me
router.delete('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await userService.deleteUser(userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /users/me/profile
router.get('/me/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const user = await userService.getUserById(userId);
    res.json({ success: true, data: user.profile });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me/profile
router.patch('/me/profile', requireAuth, validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const profile = await userService.updateProfile(userId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

// GET /users/me/preferences
router.get('/me/preferences', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const preferences = await userService.getPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me/preferences
router.patch('/me/preferences', requireAuth, validate(updatePreferencesSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const preferences = await userService.updatePreferences(userId, req.body);
    res.json({ success: true, data: preferences });
  } catch (error) {
    next(error);
  }
});

// GET /users/me/notifications
router.get('/me/notifications', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const settings = await userService.getNotificationSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me/notifications
router.patch('/me/notifications', requireAuth, validate(updateNotificationSettingsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const settings = await userService.updateNotificationSettings(userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// Organization routes
// GET /users/me/organizations
router.get('/me/organizations', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizations = await userService.getUserOrganizations(userId);
    res.json({ success: true, data: organizations });
  } catch (error) {
    next(error);
  }
});

// POST /organizations
router.post('/organizations', requireAuth, validate(createOrganizationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organization = await userService.createOrganization(userId, req.body);
    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

// GET /organizations/:id
router.get('/organizations/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = await userService.getOrganization(req.params.id);
    res.json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

// PATCH /organizations/:id
router.patch('/organizations/:id', requireAuth, validate(createOrganizationSchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organization = await userService.updateOrganization(req.params.id, userId, req.body);
    res.json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

// POST /organizations/:id/invitations
router.post('/organizations/:id/invitations', requireAuth, validate(inviteMemberSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const invitation = await userService.inviteMember(req.params.id, userId, req.body.email, req.body.role);
    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
});

// POST /organizations/accept-invitation
router.post('/organizations/accept-invitation', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token is required' },
      });
    }
    const organization = await userService.acceptInvitation(token, userId);
    res.json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

// DELETE /organizations/:id/members/:memberId
router.delete('/organizations/:id/members/:memberId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await userService.removeMember(req.params.id, userId, req.params.memberId);
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

// PATCH /organizations/:id/members/:memberId
router.patch('/organizations/:id/members/:memberId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { role } = req.body;
    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid role' },
      });
    }
    const member = await userService.updateMemberRole(req.params.id, userId, req.params.memberId, role);
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

// POST /organizations/:id/leave
router.post('/organizations/:id/leave', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await userService.leaveOrganization(req.params.id, userId);
    res.json({ success: true, message: 'Left organization successfully' });
  } catch (error) {
    next(error);
  }
});

// Internal route - get user by email (for other services)
router.get('/internal/by-email/:email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserByEmail(req.params.email);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
