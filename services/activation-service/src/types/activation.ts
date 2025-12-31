import { z } from 'zod';

// Activation status enum matching Prisma schema
export enum ActivationStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

// Activation type enum matching Prisma schema
export enum ActivationType {
  EMBED = 'EMBED',
  POPUP = 'POPUP',
  INLINE = 'INLINE',
  FLOATING = 'FLOATING',
  LIGHTBOX = 'LIGHTBOX',
  CAROUSEL = 'CAROUSEL',
  GRID = 'GRID',
  WIDGET = 'WIDGET',
}

// Embed type enum matching Prisma schema
export enum EmbedType {
  SCRIPT = 'SCRIPT',
  IFRAME = 'IFRAME',
  DIRECT_URL = 'DIRECT_URL',
  REACT_COMPONENT = 'REACT_COMPONENT',
  VUE_COMPONENT = 'VUE_COMPONENT',
  WEB_COMPONENT = 'WEB_COMPONENT',
}

// Date coercion helper
const dateSchema = z.preprocess((val) => {
  if (typeof val === 'string') return new Date(val);
  return val;
}, z.date().optional());

// Activation config schema
export const activationConfigSchema = z.object({
  width: z.string().optional(),
  height: z.string().optional(),
  autoplay: z.boolean().default(false),
  muted: z.boolean().default(true),
  loop: z.boolean().default(false),
  showControls: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  borderRadius: z.string().optional(),
  backgroundColor: z.string().optional(),
  customCss: z.string().optional(),
}).optional();

// Activation targeting schema
export const activationTargetingSchema = z.object({
  domains: z.array(z.string()).optional(),
  geoLocations: z.array(z.string()).optional(),
  devices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
  browsers: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
}).optional();

// Create activation schema
export const createActivationSchema = z.object({
  brandId: z.string().uuid(),
  contentId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(ActivationType).default(ActivationType.EMBED),
  config: activationConfigSchema,
  targeting: activationTargetingSchema,
  startDate: dateSchema,
  endDate: dateSchema,
});

// Update activation schema
export const updateActivationSchema = createActivationSchema.partial().extend({
  status: z.nativeEnum(ActivationStatus).optional(),
});

// Full activation type (with DB fields)
export interface Activation {
  id: string;
  organizationId: string;
  brandId: string;
  contentId: string;
  campaignId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  type: ActivationType;
  status: ActivationStatus;
  config?: Record<string, unknown> | null;
  targeting?: Record<string, unknown> | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateActivationInput = z.infer<typeof createActivationSchema>;
export type UpdateActivationInput = z.infer<typeof updateActivationSchema>;

// Embed code interfaces
export interface EmbedCode {
  id: string;
  activationId: string;
  type: EmbedType;
  code: string;
  hash: string;
  isActive: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedEmbedCode {
  activationId: string;
  script: string;
  iframe: string;
  directUrl: string;
  reactComponent?: string;
  vueComponent?: string;
  webComponent?: string;
}

// Analytics interfaces
export interface ActivationStats {
  views: number;
  uniqueViews: number;
  engagements: number;
  clicks: number;
  conversions: number;
  avgWatchTime?: number;
  bounceRate?: number;
}

export interface ActivationAnalyticsData {
  id: string;
  activationId: string;
  date: Date;
  views: number;
  uniqueViews: number;
  engagements: number;
  clicks: number;
  conversions: number;
  avgWatchTime?: number | null;
  bounceRate?: number | null;
  metadata?: Record<string, unknown> | null;
}

// List activations options
export interface ListActivationsOptions {
  organizationId: string;
  brandId?: string;
  campaignId?: string;
  status?: ActivationStatus;
  type?: ActivationType;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Event tracking
export interface ActivationEvent {
  activationId: string;
  eventType: string;
  visitorId?: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  device?: string;
  browser?: string;
  metadata?: Record<string, unknown>;
}
