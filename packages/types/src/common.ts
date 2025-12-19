// =============================================================================
// Common Types - Shared across all domains
// =============================================================================

export type UUID = string;
export type ISODateString = string;
export type Email = string;
export type URL = string;

export interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SoftDelete {
  deletedAt?: ISODateString | null;
  isDeleted: boolean;
}

export interface BaseEntity extends Timestamps {
  id: UUID;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: UUID;
  updatedBy: UUID;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  filters?: Record<string, unknown>;
}

export interface QueryParams extends PaginationParams, SortParams, FilterParams {}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export type Status = 'active' | 'inactive' | 'pending' | 'archived' | 'deleted';

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'NGN' | 'KES' | 'ZAR';

export interface DateRange {
  startDate: ISODateString;
  endDate: ISODateString;
}

export interface FileUpload {
  id: UUID;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface Image extends FileUpload {
  width: number;
  height: number;
  alt?: string;
}

export interface Video extends FileUpload {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec?: string;
  bitrate?: number;
  thumbnails?: string[];
  hlsUrl?: string;
  dashUrl?: string;
}

export type SocialPlatform =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'pinterest'
  | 'snapchat';

export interface SocialHandle {
  platform: SocialPlatform;
  handle: string;
  url: string;
  verified: boolean;
  followers?: number;
}

export type NotificationType =
  | 'email'
  | 'push'
  | 'sms'
  | 'in_app'
  | 'slack'
  | 'webhook';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}
