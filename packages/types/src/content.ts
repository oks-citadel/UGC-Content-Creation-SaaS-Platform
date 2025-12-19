// =============================================================================
// Content Types - UGC Asset Management & AI Generation
// =============================================================================

import type {
  UUID,
  ISODateString,
  BaseEntity,
  AuditableEntity,
  Status,
  Image,
  Video,
  SocialPlatform,
} from './common';

export type ContentStatus =
  | 'draft'
  | 'processing'
  | 'ready'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

export type ContentType =
  | 'video'
  | 'image'
  | 'carousel'
  | 'story'
  | 'reel'
  | 'tiktok'
  | 'short'
  | 'live_replay'
  | 'audio';

export type ContentSource =
  | 'upload'
  | 'ai_generated'
  | 'repurposed'
  | 'social_import'
  | 'ugc_submission';

export interface Content extends AuditableEntity {
  organizationId: UUID;
  creatorId?: UUID;
  campaignId?: UUID;

  title: string;
  description?: string;

  type: ContentType;
  source: ContentSource;
  status: ContentStatus;

  media: ContentMedia;

  metadata: ContentMetadata;

  aiMetadata?: AIContentMetadata;

  moderation?: ContentModeration;

  rights?: ContentRights;

  publishingInfo?: PublishingInfo;

  analytics?: ContentAnalytics;

  tags: string[];

  parentContentId?: UUID;
  variants?: UUID[];

  externalId?: string;
  externalUrl?: string;
}

export interface ContentMedia {
  primary: Image | Video;

  thumbnail?: Image;
  thumbnails?: Image[];

  variants?: MediaVariant[];

  captions?: CaptionTrack[];

  audio?: AudioTrack;
}

export interface MediaVariant {
  id: UUID;
  type: 'original' | 'optimized' | 'platform_specific';
  platform?: SocialPlatform;

  format: string;
  quality: string;

  width: number;
  height: number;
  aspectRatio: string;

  url: string;
  size: number;
}

export interface CaptionTrack {
  id: UUID;
  language: string;
  languageCode: string;

  type: 'auto' | 'manual' | 'professional';

  format: 'srt' | 'vtt' | 'json';
  url: string;

  isDefault: boolean;
}

export interface AudioTrack {
  id: UUID;

  type: 'original' | 'voiceover' | 'music' | 'mixed';

  url: string;
  duration: number;
  format: string;

  language?: string;

  musicInfo?: {
    title: string;
    artist: string;
    licensed: boolean;
    licenseId?: string;
  };
}

export interface ContentMetadata {
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;

  fps?: number;
  bitrate?: number;
  codec?: string;

  fileSize: number;
  mimeType: string;

  createdDate?: ISODateString;

  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };

  custom?: Record<string, unknown>;
}

export interface AIContentMetadata {
  generatedBy: string;
  modelVersion: string;
  generatedAt: ISODateString;

  prompt?: string;
  parameters?: Record<string, unknown>;

  processingTime: number;
  cost?: number;

  qualityScore?: number;

  detectedElements?: {
    faces?: number;
    objects?: string[];
    text?: string[];
    scenes?: string[];
    colors?: string[];
    emotions?: string[];
  };

  transcription?: {
    text: string;
    confidence: number;
    words?: TranscriptionWord[];
  };
}

export interface TranscriptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface ContentModeration {
  status: 'pending' | 'approved' | 'flagged' | 'rejected';

  autoModerationResult?: {
    safe: boolean;
    scores: {
      adult: number;
      violence: number;
      hate: number;
      selfHarm: number;
      drugs: number;
    };
    flags: string[];
  };

  manualReview?: {
    reviewerId: UUID;
    reviewedAt: ISODateString;
    decision: 'approved' | 'rejected';
    reason?: string;
    notes?: string;
  };

  brandSafety?: {
    score: number;
    issues: string[];
    competitorMentions?: string[];
  };
}

export interface ContentRights {
  status: 'pending' | 'granted' | 'expired' | 'revoked';

  licenseType: 'exclusive' | 'non_exclusive' | 'limited';

  usageRights: UsageRights;

  grantedAt?: ISODateString;
  expiresAt?: ISODateString;

  contractId?: UUID;

  creator?: {
    id: UUID;
    name: string;
    consentRecorded: boolean;
    consentDate?: ISODateString;
  };
}

export interface UsageRights {
  platforms: SocialPlatform[] | 'all';

  territories: string[] | 'worldwide';

  duration: 'perpetual' | 'limited';
  durationMonths?: number;

  useCases: ('organic' | 'paid' | 'website' | 'email' | 'print' | 'tv')[];

  modifications: boolean;
  derivatives: boolean;

  attribution: boolean;
  attributionText?: string;
}

export interface PublishingInfo {
  scheduledAt?: ISODateString;
  publishedAt?: ISODateString;

  platforms: PublishedPlatform[];

  autoPublish: boolean;
}

export interface PublishedPlatform {
  platform: SocialPlatform;

  status: 'scheduled' | 'published' | 'failed';

  postId?: string;
  postUrl?: string;

  caption?: string;
  hashtags?: string[];
  mentions?: string[];

  publishedAt?: ISODateString;

  error?: string;
}

export interface ContentAnalytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;

  engagementRate: number;

  watchTime?: number;
  avgWatchDuration?: number;
  completionRate?: number;

  clicks?: number;
  clickThroughRate?: number;

  conversions?: number;
  conversionRate?: number;

  byPlatform?: Record<SocialPlatform, PlatformContentAnalytics>;

  timeline?: ContentAnalyticsTimeline[];

  lastUpdatedAt: ISODateString;
}

export interface PlatformContentAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

export interface ContentAnalyticsTimeline {
  date: ISODateString;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

// AI Content Generation
export interface AIVideoGenerationRequest {
  type: 'product_showcase' | 'testimonial' | 'explainer' | 'ugc_style' | 'custom';

  script?: string;
  scriptPrompt?: string;

  productImages?: string[];
  brandAssets?: string[];
  referenceVideos?: string[];

  voiceover?: {
    voice: string;
    language: string;
    emotion?: string;
  };

  music?: {
    style: string;
    tempo?: string;
    mood?: string;
  };

  duration: number;
  aspectRatio: '9:16' | '1:1' | '16:9' | '4:5';

  style?: {
    visualStyle?: string;
    colorPalette?: string[];
    fontStyle?: string;
  };

  platform?: SocialPlatform;

  variations?: number;
}

export interface AIVideoGenerationJob extends BaseEntity {
  organizationId: UUID;

  request: AIVideoGenerationRequest;

  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;

  results?: AIGeneratedVideo[];

  error?: string;

  startedAt?: ISODateString;
  completedAt?: ISODateString;

  cost?: number;
}

export interface AIGeneratedVideo {
  id: UUID;
  url: string;
  thumbnailUrl: string;

  duration: number;
  aspectRatio: string;

  script?: string;

  qualityScore: number;

  metadata: AIContentMetadata;
}

export interface AIScriptGenerationRequest {
  type: 'hook' | 'full_script' | 'cta' | 'caption';

  product?: {
    name: string;
    description: string;
    features?: string[];
    benefits?: string[];
    targetAudience?: string;
  };

  tone: 'professional' | 'casual' | 'funny' | 'emotional' | 'urgent';

  platform: SocialPlatform;

  duration?: number;

  keywords?: string[];

  avoidKeywords?: string[];

  includeHook: boolean;
  includeCTA: boolean;

  variations: number;

  language?: string;
}

export interface AIGeneratedScript {
  id: UUID;

  hook?: string;
  body: string;
  cta?: string;
  fullScript: string;

  wordCount: number;
  estimatedDuration: number;

  suggestedHashtags?: string[];

  qualityScore: number;
}

// Content Library
export interface ContentLibrary extends BaseEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  type: 'brand_assets' | 'ugc' | 'templates' | 'ai_generated' | 'archive';

  status: Status;

  contentCount: number;
  totalSize: number;

  settings: {
    autoTagging: boolean;
    retentionDays?: number;
    accessLevel: 'public' | 'team' | 'private';
  };
}

export interface ContentFolder extends BaseEntity {
  libraryId: UUID;
  parentId?: UUID;

  name: string;
  path: string;

  contentCount: number;

  color?: string;
  icon?: string;
}

export interface ContentCollection extends BaseEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  type: 'manual' | 'smart';

  contentIds?: UUID[];

  smartFilters?: {
    tags?: string[];
    types?: ContentType[];
    dateRange?: { start: ISODateString; end: ISODateString };
    creators?: UUID[];
    campaigns?: UUID[];
    minEngagement?: number;
  };

  coverImage?: Image;

  isPublic: boolean;
  shareLink?: string;
}
