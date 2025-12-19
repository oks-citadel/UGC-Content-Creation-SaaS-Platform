// =============================================================================
// API Types - Request/Response DTOs & API Contracts
// =============================================================================

import type {
  UUID,
  ISODateString,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  SocialPlatform,
  Money,
  BaseEntity,
} from './common';

import type {
  User,
  UserProfile,
  UserUpdateInput,
  Organization,
  AuthCredentials,
  RegisterInput,
  OAuthInput,
  AuthSession,
} from './user';

import type {
  Campaign,
  CampaignStatus,
  CampaignType,
  CampaignApplication,
  CampaignDeliverable,
} from './campaign';

import type { Creator, CreatorSearchParams, CreatorSearchResult } from './creator';
import type { Content, ContentStatus, AIVideoGenerationRequest } from './content';
import type { Product, ShoppableGallery, Order } from './commerce';
import type { Dashboard, MetricValue } from './analytics';

// =============================================================================
// Auth API
// =============================================================================

export interface LoginRequest {
  credentials: AuthCredentials;
  deviceInfo?: {
    deviceId?: string;
    platform?: string;
    appVersion?: string;
  };
}

export interface LoginResponse {
  user: User;
  session: AuthSession;
}

export interface RegisterRequest {
  input: RegisterInput;
}

export interface RegisterResponse {
  user: User;
  session: AuthSession;
  verificationEmailSent: boolean;
}

export interface OAuthLoginRequest {
  input: OAuthInput;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODateString;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// =============================================================================
// User API
// =============================================================================

export interface GetUserResponse extends ApiResponse<User> {}

export interface UpdateUserRequest {
  input: UserUpdateInput;
}

export interface UpdateUserResponse extends ApiResponse<User> {}

export interface GetUserProfileResponse extends ApiResponse<UserProfile> {}

export interface UploadAvatarRequest {
  file: File;
}

export interface UploadAvatarResponse extends ApiResponse<{ avatarUrl: string }> {}

// =============================================================================
// Organization API
// =============================================================================

export interface GetOrganizationResponse extends ApiResponse<Organization> {}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  website?: string;
  billingEmail?: string;
}

export interface UpdateOrganizationResponse extends ApiResponse<Organization> {}

export interface InviteMemberRequest {
  email: string;
  role: string;
  message?: string;
}

export interface InviteMemberResponse extends ApiResponse<{ inviteId: UUID; inviteUrl: string }> {}

export interface UpdateMemberRoleRequest {
  memberId: UUID;
  role: string;
}

export interface RemoveMemberRequest {
  memberId: UUID;
}

// =============================================================================
// Campaign API
// =============================================================================

export interface ListCampaignsRequest extends QueryParams {
  status?: CampaignStatus[];
  type?: CampaignType[];
  dateFrom?: ISODateString;
  dateTo?: ISODateString;
}

export interface ListCampaignsResponse extends PaginatedResponse<Campaign> {}

export interface GetCampaignResponse extends ApiResponse<Campaign> {}

export interface CreateCampaignRequest {
  name: string;
  type: CampaignType;
  objective: string;
  brief: {
    headline: string;
    summary: string;
    guidelines: string;
    doList: string[];
    dontList: string[];
    keyMessages: string[];
  };
  budget: {
    total: Money;
  };
  timeline: {
    startDate: ISODateString;
    endDate: ISODateString;
  };
  targetPlatforms: SocialPlatform[];
  creatorRequirements?: {
    minFollowers?: number;
    niches?: string[];
    platforms?: SocialPlatform[];
  };
  isTemplate?: boolean;
}

export interface CreateCampaignResponse extends ApiResponse<Campaign> {}

export interface UpdateCampaignRequest {
  campaignId: UUID;
  updates: Partial<CreateCampaignRequest>;
}

export interface UpdateCampaignResponse extends ApiResponse<Campaign> {}

export interface UpdateCampaignStatusRequest {
  campaignId: UUID;
  status: CampaignStatus;
  reason?: string;
}

export interface DuplicateCampaignRequest {
  campaignId: UUID;
  name: string;
}

export interface DuplicateCampaignResponse extends ApiResponse<Campaign> {}

// Campaign Applications
export interface ListApplicationsRequest extends QueryParams {
  campaignId: UUID;
  status?: string[];
}

export interface ListApplicationsResponse extends PaginatedResponse<CampaignApplication> {}

export interface ReviewApplicationRequest {
  applicationId: UUID;
  decision: 'approved' | 'rejected';
  notes?: string;
}

// Campaign Deliverables
export interface ListDeliverablesRequest extends QueryParams {
  campaignId: UUID;
  creatorId?: UUID;
  status?: string[];
}

export interface ListDeliverablesResponse extends PaginatedResponse<CampaignDeliverable> {}

export interface SubmitDeliverableRequest {
  deliverableId: UUID;
  fileUrl: string;
  caption?: string;
  notes?: string;
}

export interface ReviewDeliverableRequest {
  deliverableId: UUID;
  decision: 'approved' | 'revision_requested' | 'rejected';
  feedback?: string;
}

// =============================================================================
// Creator API
// =============================================================================

export interface SearchCreatorsRequest extends CreatorSearchParams {}

export interface SearchCreatorsResponse extends PaginatedResponse<CreatorSearchResult> {}

export interface GetCreatorResponse extends ApiResponse<Creator> {}

export interface UpdateCreatorProfileRequest {
  displayName?: string;
  bio?: string;
  niches?: string[];
  contentTypes?: string[];
  languages?: string[];
  rates?: {
    baseRates?: Record<string, Money>;
    negotiable?: boolean;
  };
}

export interface UpdateCreatorProfileResponse extends ApiResponse<Creator> {}

export interface ConnectSocialAccountRequest {
  platform: SocialPlatform;
  authCode: string;
  redirectUri: string;
}

export interface ConnectSocialAccountResponse
  extends ApiResponse<{ connected: boolean; handle: string }> {}

export interface DisconnectSocialAccountRequest {
  platform: SocialPlatform;
}

export interface AddPortfolioItemRequest {
  title: string;
  description?: string;
  type: 'video' | 'image' | 'link';
  mediaUrls?: string[];
  externalUrl?: string;
  tags?: string[];
}

export interface AddPortfolioItemResponse extends ApiResponse<{ itemId: UUID }> {}

export interface InviteCreatorRequest {
  campaignId: UUID;
  creatorId: UUID;
  message?: string;
  proposedRate?: Money;
}

export interface InviteCreatorResponse extends ApiResponse<{ invitationId: UUID }> {}

// =============================================================================
// Content API
// =============================================================================

export interface ListContentRequest extends QueryParams {
  status?: ContentStatus[];
  type?: string[];
  campaignId?: UUID;
  creatorId?: UUID;
}

export interface ListContentResponse extends PaginatedResponse<Content> {}

export interface GetContentResponse extends ApiResponse<Content> {}

export interface UploadContentRequest {
  file: File;
  title: string;
  description?: string;
  campaignId?: UUID;
  tags?: string[];
}

export interface UploadContentResponse extends ApiResponse<Content> {}

export interface UpdateContentRequest {
  contentId: UUID;
  title?: string;
  description?: string;
  tags?: string[];
  status?: ContentStatus;
}

export interface UpdateContentResponse extends ApiResponse<Content> {}

export interface GenerateAIVideoRequest {
  request: AIVideoGenerationRequest;
}

export interface GenerateAIVideoResponse extends ApiResponse<{ jobId: UUID }> {}

export interface GetAIJobStatusRequest {
  jobId: UUID;
}

export interface GetAIJobStatusResponse
  extends ApiResponse<{
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress?: number;
    results?: { id: UUID; url: string; thumbnailUrl: string }[];
    error?: string;
  }> {}

export interface GenerateScriptRequest {
  type: 'hook' | 'full_script' | 'cta' | 'caption';
  product?: {
    name: string;
    description: string;
    features?: string[];
  };
  tone: string;
  platform: SocialPlatform;
  variations?: number;
}

export interface GenerateScriptResponse
  extends ApiResponse<{
    scripts: { id: UUID; content: string; qualityScore: number }[];
  }> {}

// =============================================================================
// Commerce API
// =============================================================================

export interface ListProductsRequest extends QueryParams {
  storeId?: UUID;
  status?: string[];
  category?: string;
}

export interface ListProductsResponse extends PaginatedResponse<Product> {}

export interface GetProductResponse extends ApiResponse<Product> {}

export interface SyncProductsRequest {
  storeId: UUID;
}

export interface SyncProductsResponse extends ApiResponse<{ syncedCount: number }> {}

// Galleries
export interface ListGalleriesRequest extends QueryParams {
  status?: string[];
}

export interface ListGalleriesResponse extends PaginatedResponse<ShoppableGallery> {}

export interface GetGalleryResponse extends ApiResponse<ShoppableGallery> {}

export interface CreateGalleryRequest {
  name: string;
  type: 'curated' | 'ugc' | 'mixed' | 'product';
  layout: {
    type: 'grid' | 'carousel' | 'masonry';
    columns?: number;
  };
  contentIds?: UUID[];
  productIds?: UUID[];
}

export interface CreateGalleryResponse extends ApiResponse<ShoppableGallery> {}

export interface UpdateGalleryRequest {
  galleryId: UUID;
  name?: string;
  layout?: object;
  styling?: object;
  settings?: object;
}

export interface UpdateGalleryResponse extends ApiResponse<ShoppableGallery> {}

export interface GetGalleryEmbedCodeRequest {
  galleryId: UUID;
}

export interface GetGalleryEmbedCodeResponse extends ApiResponse<{ embedCode: string }> {}

// Orders
export interface ListOrdersRequest extends QueryParams {
  storeId?: UUID;
  status?: string[];
  dateFrom?: ISODateString;
  dateTo?: ISODateString;
  attributed?: boolean;
}

export interface ListOrdersResponse extends PaginatedResponse<Order> {}

export interface GetOrderResponse extends ApiResponse<Order> {}

// =============================================================================
// Analytics API
// =============================================================================

export interface GetDashboardRequest {
  dashboardId: UUID;
}

export interface GetDashboardResponse extends ApiResponse<Dashboard> {}

export interface GetMetricsRequest {
  metrics: string[];
  dateRange: {
    start: ISODateString;
    end: ISODateString;
  };
  granularity?: string;
  filters?: Record<string, unknown>;
  comparison?: 'previous_period' | 'previous_year';
}

export interface GetMetricsResponse
  extends ApiResponse<{
    metrics: MetricValue[];
    comparison?: MetricValue[];
  }> {}

export interface GetCampaignAnalyticsRequest {
  campaignId: UUID;
  dateRange?: {
    start: ISODateString;
    end: ISODateString;
  };
}

export interface GetCampaignAnalyticsResponse
  extends ApiResponse<{
    overview: Record<string, MetricValue>;
    byPlatform: Record<SocialPlatform, Record<string, number>>;
    byCreator: { creatorId: UUID; metrics: Record<string, number> }[];
    timeline: { date: ISODateString; metrics: Record<string, number> }[];
  }> {}

export interface GetAttributionAnalyticsRequest {
  model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay';
  dateRange: {
    start: ISODateString;
    end: ISODateString;
  };
}

export interface GetAttributionAnalyticsResponse
  extends ApiResponse<{
    totalConversions: number;
    totalRevenue: Money;
    byChannel: { channel: string; conversions: number; revenue: Money; percentage: number }[];
    byCampaign: {
      campaignId: UUID;
      name: string;
      conversions: number;
      revenue: Money;
      roi: number;
    }[];
  }> {}

export interface ExportReportRequest {
  reportId: UUID;
  format: 'pdf' | 'excel' | 'csv';
  dateRange?: {
    start: ISODateString;
    end: ISODateString;
  };
}

export interface ExportReportResponse extends ApiResponse<{ exportId: UUID; downloadUrl?: string }> {}

// =============================================================================
// Webhook Events
// =============================================================================

export type WebhookEventType =
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.status_changed'
  | 'application.received'
  | 'application.reviewed'
  | 'deliverable.submitted'
  | 'deliverable.approved'
  | 'content.uploaded'
  | 'content.published'
  | 'order.created'
  | 'order.attributed'
  | 'payment.completed'
  | 'creator.connected'
  | 'alert.triggered';

export interface WebhookEvent<T = unknown> {
  id: UUID;
  type: WebhookEventType;
  timestamp: ISODateString;
  organizationId: UUID;
  data: T;
}

export interface WebhookEndpoint extends BaseEntity {
  organizationId: UUID;

  url: string;
  secret: string;

  events: WebhookEventType[];

  status: 'active' | 'inactive' | 'failing';

  lastDeliveryAt?: ISODateString;
  lastDeliveryStatus?: 'success' | 'failed';
  failureCount: number;
}

export interface WebhookDelivery extends BaseEntity {
  endpointId: UUID;
  eventId: UUID;

  status: 'pending' | 'delivered' | 'failed';

  requestBody: string;
  responseStatus?: number;
  responseBody?: string;

  attempts: number;
  nextRetryAt?: ISODateString;

  deliveredAt?: ISODateString;
  duration?: number;
}
