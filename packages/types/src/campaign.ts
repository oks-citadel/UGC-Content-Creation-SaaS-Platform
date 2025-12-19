// =============================================================================
// Campaign Types - Campaign Management & Workflow
// =============================================================================

import type {
  UUID,
  ISODateString,
  BaseEntity,
  AuditableEntity,
  Money,
  DateRange,
  Image,
  Video,
  SocialPlatform,
} from './common';

export type CampaignStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type CampaignType =
  | 'ugc_creation'
  | 'influencer_marketing'
  | 'brand_awareness'
  | 'product_launch'
  | 'seasonal'
  | 'evergreen'
  | 'ambassador';

export type CampaignObjective =
  | 'awareness'
  | 'engagement'
  | 'traffic'
  | 'conversions'
  | 'sales'
  | 'app_installs'
  | 'lead_generation';

export interface Campaign extends AuditableEntity {
  organizationId: UUID;

  name: string;
  slug: string;
  description?: string;

  type: CampaignType;
  objective: CampaignObjective;
  status: CampaignStatus;

  brief: CampaignBrief;
  budget: CampaignBudget;
  timeline: CampaignTimeline;

  targetPlatforms: SocialPlatform[];
  targetAudience?: TargetAudience;

  creatorRequirements?: CreatorRequirements;

  assets: CampaignAsset[];
  products?: CampaignProduct[];

  workflow: CampaignWorkflow;

  metrics?: CampaignMetrics;

  tags: string[];

  isTemplate: boolean;
  templateId?: UUID;

  metadata?: Record<string, unknown>;
}

export interface CampaignBrief {
  headline: string;
  summary: string;
  guidelines: string;

  doList: string[];
  dontList: string[];

  keyMessages: string[];
  hashtags: string[];
  mentions: string[];

  callToAction?: string;
  landingPageUrl?: string;

  referenceContent?: ReferenceContent[];

  additionalNotes?: string;
}

export interface ReferenceContent {
  type: 'image' | 'video' | 'link';
  url: string;
  title?: string;
  description?: string;
}

export interface CampaignBudget {
  total: Money;
  allocated: Money;
  spent: Money;
  remaining: Money;

  creatorBudget?: Money;
  adSpendBudget?: Money;
  platformFees?: Money;

  paymentTerms?: PaymentTerms;
}

export interface PaymentTerms {
  type: 'fixed' | 'milestone' | 'performance';
  milestones?: PaymentMilestone[];
  performanceMetrics?: PerformancePaymentMetric[];
}

export interface PaymentMilestone {
  id: UUID;
  name: string;
  percentage: number;
  amount: Money;
  triggerEvent: string;
  status: 'pending' | 'triggered' | 'paid';
  paidAt?: ISODateString;
}

export interface PerformancePaymentMetric {
  metric: string;
  threshold: number;
  bonus: Money;
}

export interface CampaignTimeline {
  overall: DateRange;

  briefingPeriod?: DateRange;
  creationPeriod?: DateRange;
  reviewPeriod?: DateRange;
  publishPeriod?: DateRange;

  milestones: TimelineMilestone[];
}

export interface TimelineMilestone {
  id: UUID;
  name: string;
  date: ISODateString;
  type: 'deadline' | 'checkpoint' | 'launch';
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue';
  description?: string;
}

export interface TargetAudience {
  demographics: {
    ageRange?: { min: number; max: number };
    genders?: ('male' | 'female' | 'other')[];
    locations?: string[];
    languages?: string[];
  };

  interests?: string[];
  behaviors?: string[];

  customAudiences?: UUID[];
  excludedAudiences?: UUID[];
}

export interface CreatorRequirements {
  minFollowers?: number;
  maxFollowers?: number;

  minEngagementRate?: number;

  niches?: string[];
  excludedNiches?: string[];

  platforms: SocialPlatform[];

  demographics?: {
    ageRange?: { min: number; max: number };
    genders?: ('male' | 'female' | 'other')[];
    locations?: string[];
  };

  contentTypes?: ContentType[];

  previousBrandExperience?: boolean;
  verifiedOnly?: boolean;

  maxCreators?: number;
}

// ContentType is imported from content.ts
import type { ContentType } from './content';
export type { ContentType };

export interface CampaignAsset extends BaseEntity {
  campaignId: UUID;

  name: string;
  type: 'brand_asset' | 'product_image' | 'reference' | 'template';

  file: Image | Video;

  isRequired: boolean;
  downloadCount: number;
}

export interface CampaignProduct {
  id: UUID;
  campaignId: UUID;

  productId: string;
  name: string;
  description?: string;

  images: Image[];
  price: Money;

  productUrl?: string;

  tags?: string[];
}

export interface CampaignWorkflow {
  approvalRequired: boolean;
  approvers?: UUID[];

  stages: WorkflowStage[];
  currentStage: string;

  automations?: WorkflowAutomation[];
}

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';

  requiredActions?: string[];
  completedActions?: string[];

  assignees?: UUID[];

  startedAt?: ISODateString;
  completedAt?: ISODateString;

  autoAdvance?: boolean;
  autoAdvanceConditions?: Record<string, unknown>;
}

export interface WorkflowAutomation {
  id: UUID;
  trigger: string;
  action: string;
  conditions?: Record<string, unknown>;
  enabled: boolean;
}

export interface CampaignMetrics {
  overview: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    engagementRate: number;
    totalClicks: number;
    clickThroughRate: number;
    totalConversions: number;
    conversionRate: number;
    totalRevenue: Money;
    roi: number;
  };

  byPlatform: Record<SocialPlatform, PlatformMetrics>;
  byContent: ContentMetrics[];
  byCreator: CreatorCampaignMetrics[];

  timeline: MetricsTimeline[];
}

export interface PlatformMetrics {
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  clicks: number;
  conversions: number;
  revenue: Money;
}

export interface ContentMetrics {
  contentId: UUID;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  conversions: number;
}

export interface CreatorCampaignMetrics {
  creatorId: UUID;
  contentCount: number;
  totalReach: number;
  totalEngagement: number;
  engagementRate: number;
  conversions: number;
  revenue: Money;
}

export interface MetricsTimeline {
  date: ISODateString;
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// Campaign Application (Creator applying to campaign)
export interface CampaignApplication extends BaseEntity {
  campaignId: UUID;
  creatorId: UUID;

  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';

  pitch?: string;
  proposedRate?: Money;
  proposedDeliverables?: string[];

  portfolio?: UUID[];

  reviewedBy?: UUID;
  reviewedAt?: ISODateString;
  reviewNotes?: string;

  metadata?: Record<string, unknown>;
}

// Campaign Deliverable
export interface CampaignDeliverable extends AuditableEntity {
  campaignId: UUID;
  creatorId: UUID;

  type: ContentType;
  platform: SocialPlatform;

  status: DeliverableStatus;

  dueDate: ISODateString;
  submittedAt?: ISODateString;
  approvedAt?: ISODateString;
  publishedAt?: ISODateString;

  content?: DeliverableContent;

  revisions: DeliverableRevision[];

  payment?: DeliverablePayment;
}

export type DeliverableStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'in_review'
  | 'revision_requested'
  | 'approved'
  | 'published'
  | 'rejected';

export interface DeliverableContent {
  fileUrl: string;
  thumbnailUrl?: string;

  caption?: string;
  hashtags?: string[];
  mentions?: string[];

  publishedUrl?: string;
  publishedId?: string;
}

export interface DeliverableRevision {
  id: UUID;
  version: number;
  fileUrl: string;
  notes?: string;
  status: 'submitted' | 'approved' | 'rejected';
  reviewedBy?: UUID;
  reviewedAt?: ISODateString;
  feedback?: string;
  createdAt: ISODateString;
}

export interface DeliverablePayment {
  amount: Money;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paidAt?: ISODateString;
  transactionId?: string;
}

// Campaign Template
export interface CampaignTemplate extends BaseEntity {
  organizationId?: UUID;

  name: string;
  description?: string;

  type: CampaignType;
  objective: CampaignObjective;

  brief: Partial<CampaignBrief>;

  targetPlatforms?: SocialPlatform[];
  creatorRequirements?: Partial<CreatorRequirements>;

  workflowTemplate?: Partial<CampaignWorkflow>;

  isPublic: boolean;
  useCount: number;

  tags: string[];
}
