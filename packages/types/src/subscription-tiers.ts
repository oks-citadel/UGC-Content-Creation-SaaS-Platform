// Subscription Tiers Types
import type { UUID, ISODateString } from "./common";

export type SubscriptionTier = 'saas-free' | 'saas-standard' | 'saas-premium' | 'saas-enterprise';
export type LegacyPlanName = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
export const PLAN_TO_TIER_MAP = { free: 'saas-free', starter: 'saas-standard', professional: 'saas-premium', enterprise: 'saas-enterprise', custom: 'saas-enterprise' };
export type UserAccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type InternalRole = 'super_admin' | 'admin' | 'operator' | 'support';
export type ConsumerRole = 'brand_owner' | 'brand_manager' | 'brand_member' | 'creator' | 'agency_owner' | 'agency_manager' | 'agency_member';
export type UserRole = InternalRole | ConsumerRole;
export interface AccessGroup { id: UUID; name: string; slug: string; description: string; tier: SubscriptionTier; permissions: Permission[]; isInternal: boolean; createdAt: ISODateString; updatedAt: ISODateString; }
export interface Permission { id: UUID; name: string; resource: string; action: 'create' | 'read' | 'update' | 'delete' | 'execute' | '*'; }
export interface TierLimits { maxProjects: number | null; maxVideosPerMonth: number | null; maxStorageGB: number | null; maxTeamMembers: number | null; analyticsRetentionDays: number; advancedAnalytics: boolean; prioritySupport: boolean; apiAccess: boolean; apiRateLimit: number; webhookAccess: boolean; }
export type AccessChangeReason = 'signup' | 'subscription_upgrade' | 'subscription_downgrade' | 'subscription_cancel' | 'suspension' | 'reactivation' | 'admin_action';
export interface AccessChangeEvent { id: UUID; userId: UUID; changeType: 'group_added' | 'group_removed' | 'tier_changed' | 'status_changed'; reason: AccessChangeReason; previousTier?: SubscriptionTier; newTier?: SubscriptionTier; triggeredBy: 'system' | 'webhook' | 'admin' | 'api'; idempotencyKey?: string; createdAt: ISODateString; }
export interface GroupMembership { id: UUID; userId: UUID; groupId: UUID; groupSlug: string; assignedAt: ISODateString; isActive: boolean; }
export type StripeAccessEvent = 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted' | 'invoice.paid' | 'invoice.payment_failed';
export type SuspensionReason = 'payment_failure' | 'tos_violation' | 'security_concern' | 'fraud_detection' | 'admin_action';
export interface UserSuspension { id: UUID; userId: UUID; reason: SuspensionReason; suspendedAt: ISODateString; suspendedBy?: UUID; resolvedAt?: ISODateString; }
export interface RoleEscalationPolicy { protectedRoles: InternalRole[]; maxConsumerRole: ConsumerRole; internalIdentityProviders: string[]; }
export const DEFAULT_ESCALATION_POLICY: RoleEscalationPolicy = { protectedRoles: ['super_admin', 'admin', 'operator', 'support'], maxConsumerRole: 'brand_owner', internalIdentityProviders: ['internal-sso', 'admin-portal'] };
