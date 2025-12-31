// =============================================================================
// NEXUS Platform Types - Main Entry Point
// =============================================================================

// Common types used across all modules
export * from './common';

// Domain-specific types
export * from './user';
export * from './campaign';
export * from './creator';
export * from './content';
export * from './commerce';
export * from './analytics';

// API contracts and DTOs
export * from './api';

// Error types, codes, and HTTP status mappings
export * from './errors';

// Subscription tiers and access control types (excluding UserRole which is defined in user.ts)
export type {
  SubscriptionTier,
  LegacyPlanName,
  UserAccountStatus,
  InternalRole,
  ConsumerRole,
  AccessGroup,
  Permission,
  TierLimits,
  AccessChangeReason,
  AccessChangeEvent,
  GroupMembership,
  StripeAccessEvent,
  SuspensionReason,
  UserSuspension,
  RoleEscalationPolicy,
} from './subscription-tiers';

export { PLAN_TO_TIER_MAP, DEFAULT_ESCALATION_POLICY } from './subscription-tiers';
