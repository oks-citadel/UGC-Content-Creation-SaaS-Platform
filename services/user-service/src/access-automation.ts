// Access Automation Service - Handles user lifecycle access management
import { v4 as uuidv4 } from 'uuid';
import { prisma } from './lib/prisma';
import { AppError } from './lib/errors';
const TIER_GROUP_MAP = { free: 'saas-free', starter: 'saas-standard', professional: 'saas-premium', enterprise: 'saas-enterprise' };
const PROTECTED_ROLES = ['super_admin', 'admin', 'operator', 'support'];
const INTERNAL_IDENTITY_PROVIDERS = ['internal-sso', 'admin-portal'];

class AccessAutomationService {
  async handleUserSignup(userId: string) {
    await this.assignGroup(userId, 'saas-free', 'signup');
  }

  async handleSubscriptionChange(userId: string, oldPlan: string, newPlan: string) {
    const oldGroup = TIER_GROUP_MAP[oldPlan] || 'saas-free';
    const newGroup = TIER_GROUP_MAP[newPlan] || 'saas-free';
    if (oldGroup \!== newGroup) {
      await this.revokeGroup(userId, oldGroup);
      await this.assignGroup(userId, newGroup, 'subscription_upgrade');
    }
  }

  async handleSuspension(userId: string, reason: string) {
    await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
    await prisma.session.deleteMany({ where: { userId } });
    await this.logAudit(userId, 'USER_SUSPENDED', { reason });
  }

  async validateRoleAssignment(targetRole: string, identityProvider: string): boolean {
    if (PROTECTED_ROLES.includes(targetRole)) {
      return INTERNAL_IDENTITY_PROVIDERS.includes(identityProvider);
    }
    return true;
  }

  private async assignGroup(userId: string, groupSlug: string, reason: string) {
    const existing = await prisma.groupMembership.findFirst({ where: { userId, groupSlug, isActive: true } });
    if (existing) return;
    await prisma.groupMembership.create({ data: { id: uuidv4(), userId, groupId: groupSlug, groupSlug, assignedAt: new Date().toISOString(), isActive: true, assignmentReason: reason } });
  }

  private async revokeGroup(userId: string, groupSlug: string) {
    await prisma.groupMembership.updateMany({ where: { userId, groupSlug, isActive: true }, data: { isActive: false, revokedAt: new Date().toISOString() } });
  }

  private async logAudit(userId: string, action: string, metadata?: object) {
    await prisma.auditLog.create({ data: { userId, action, metadata: metadata as any, createdAt: new Date() } });
  }
}

export const accessAutomation = new AccessAutomationService();
