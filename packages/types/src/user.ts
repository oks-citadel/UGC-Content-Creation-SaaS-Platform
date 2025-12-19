// =============================================================================
// User Types - Authentication & User Management
// =============================================================================

import type {
  UUID,
  ISODateString,
  Email,
  BaseEntity,
  SoftDelete,
  Status,
  Address,
  Image,
  NotificationPreferences,
  SocialHandle,
} from './common';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'brand_owner'
  | 'brand_manager'
  | 'brand_member'
  | 'creator'
  | 'agency_owner'
  | 'agency_manager'
  | 'agency_member';

export type AccountType = 'brand' | 'creator' | 'agency' | 'admin';

export type AuthProvider = 'email' | 'google' | 'github' | 'microsoft' | 'tiktok' | 'meta';

export interface User extends BaseEntity, SoftDelete {
  email: Email;
  emailVerified: boolean;
  emailVerifiedAt?: ISODateString;

  firstName: string;
  lastName: string;
  displayName?: string;

  avatar?: Image;
  phone?: string;
  phoneVerified: boolean;

  accountType: AccountType;
  role: UserRole;
  status: Status;

  organizationId?: UUID;

  timezone: string;
  locale: string;

  preferences: UserPreferences;

  lastLoginAt?: ISODateString;
  lastActiveAt?: ISODateString;

  mfaEnabled: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email';

  metadata?: Record<string, unknown>;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  currency: string;
  emailDigest: 'daily' | 'weekly' | 'never';
}

export interface UserProfile extends User {
  bio?: string;
  website?: string;
  location?: string;
  socialHandles: SocialHandle[];
}

export interface AuthSession {
  id: UUID;
  userId: UUID;
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODateString;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
  createdAt: ISODateString;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  appVersion?: string;
}

export interface AuthCredentials {
  email: Email;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  email: Email;
  password: string;
  firstName: string;
  lastName: string;
  accountType: AccountType;
  organizationName?: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

export interface OAuthInput {
  provider: AuthProvider;
  code: string;
  redirectUri: string;
  state?: string;
}

export interface PasswordResetRequest {
  email: Email;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  preferences?: Partial<UserPreferences>;
}

// Organization Types
export interface Organization extends BaseEntity, SoftDelete {
  name: string;
  slug: string;
  type: AccountType;

  logo?: Image;
  website?: string;
  description?: string;

  billingEmail: Email;
  billingAddress?: Address;

  status: Status;

  plan: SubscriptionPlan;
  planExpiresAt?: ISODateString;

  settings: OrganizationSettings;

  ownerId: UUID;

  memberCount: number;

  metadata?: Record<string, unknown>;
}

export interface OrganizationSettings {
  allowMemberInvites: boolean;
  defaultRole: UserRole;
  requireMfa: boolean;
  allowedDomains?: string[];
  brandGuidelines?: BrandGuidelines;
}

export interface BrandGuidelines {
  primaryColor: string;
  secondaryColor: string;
  fonts?: string[];
  logoUrl?: string;
  voiceTone?: string;
  keywords?: string[];
  restrictions?: string[];
}

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface OrganizationMember extends BaseEntity {
  organizationId: UUID;
  userId: UUID;
  role: UserRole;
  status: 'active' | 'pending' | 'inactive';
  invitedBy?: UUID;
  invitedAt?: ISODateString;
  joinedAt?: ISODateString;
  permissions: string[];
}

export interface OrganizationInvite extends BaseEntity {
  organizationId: UUID;
  email: Email;
  role: UserRole;
  invitedBy: UUID;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expiresAt: ISODateString;
}

// API Key Types
export interface ApiKey extends BaseEntity {
  organizationId: UUID;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  status: 'active' | 'revoked';
  lastUsedAt?: ISODateString;
  expiresAt?: ISODateString;
  createdBy: UUID;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  expiresAt?: ISODateString;
}

export interface ApiKeyResponse {
  id: UUID;
  name: string;
  key: string; // Only returned once on creation
  scopes: string[];
  expiresAt?: ISODateString;
}
