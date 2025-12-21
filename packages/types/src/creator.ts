// =============================================================================
// Creator Types - Creator Marketplace & Management
// =============================================================================

import type {
  UUID,
  ISODateString,
  BaseEntity,
  AuditableEntity,
  Status,
  Money,
  Image,
  Video,
  SocialPlatform,
  Address,
  GeoLocation,
} from './common';

export type CreatorTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega' | 'celebrity';

export type CreatorStatus = 'pending' | 'active' | 'suspended' | 'inactive' | 'banned';

export interface Creator extends AuditableEntity {
  userId: UUID;

  displayName: string;
  username: string;
  bio?: string;

  avatar?: Image;
  coverImage?: Image;

  status: CreatorStatus;
  verificationStatus: VerificationStatus;

  tier: CreatorTier;

  location?: CreatorLocation;

  niches: string[];
  contentTypes: string[];
  languages: string[];

  socialAccounts: CreatorSocialAccount[];

  portfolio: PortfolioItem[];

  rates: CreatorRates;

  metrics: CreatorMetrics;

  settings: CreatorSettings;

  badges: CreatorBadge[];

  rating: CreatorRating;

  paymentInfo?: CreatorPaymentInfo;

  metadata?: Record<string, unknown>;
}

export interface VerificationStatus {
  identity: boolean;
  email: boolean;
  phone: boolean;
  socialAccounts: boolean;
  payment: boolean;
  verifiedAt?: ISODateString;
}

export interface CreatorLocation {
  city?: string;
  state?: string;
  country: string;
  timezone: string;
  geo?: GeoLocation;
}

export interface CreatorSocialAccount extends BaseEntity {
  creatorId: UUID;

  platform: SocialPlatform;
  handle: string;
  url: string;

  verified: boolean;
  connected: boolean;

  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: ISODateString;

  metrics: SocialAccountMetrics;

  lastSyncedAt?: ISODateString;
}

export interface SocialAccountMetrics {
  followers: number;
  following: number;
  posts: number;

  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
  avgViews?: number;

  engagementRate: number;

  growthRate?: number;

  audienceDemographics?: AudienceDemographics;

  updatedAt: ISODateString;
}

export interface AudienceDemographics {
  genders?: { male: number; female: number; other: number };
  ageRanges?: Record<string, number>;
  topCountries?: { country: string; percentage: number }[];
  topCities?: { city: string; percentage: number }[];
  interests?: { interest: string; percentage: number }[];
}

export interface PortfolioItem extends BaseEntity {
  creatorId: UUID;

  title: string;
  description?: string;

  type: 'video' | 'image' | 'carousel' | 'link';
  platform?: SocialPlatform;

  media: (Image | Video)[];
  externalUrl?: string;

  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };

  campaignId?: UUID;
  brandName?: string;

  tags: string[];

  isFeatured: boolean;
  order: number;
}

export interface CreatorRates {
  currency: string;

  baseRates: Record<string, Money>;

  platformRates: Partial<Record<SocialPlatform, PlatformRates>>;

  packageDeals?: PackageDeal[];

  negotiable: boolean;

  minimumBudget?: Money;
}

export interface PlatformRates {
  post?: Money;
  story?: Money;
  reel?: Money;
  video?: Money;
  live?: Money;
  carousel?: Money;
}

export interface PackageDeal {
  id: UUID;
  name: string;
  description?: string;

  deliverables: {
    platform: SocialPlatform;
    type: string;
    quantity: number;
  }[];

  price: Money;

  validUntil?: ISODateString;
}

export interface CreatorMetrics {
  totalCampaigns: number;
  completedCampaigns: number;

  totalEarnings: Money;
  avgCampaignValue: Money;

  totalContent: number;
  totalReach: number;
  totalEngagement: number;

  avgEngagementRate: number;
  avgResponseTime: number;

  onTimeDeliveryRate: number;
  revisionRate: number;

  brandRepeatRate: number;

  updatedAt: ISODateString;
}

export interface CreatorSettings {
  availability: CreatorAvailability;

  notifications: {
    newOpportunities: boolean;
    messages: boolean;
    campaignUpdates: boolean;
    paymentUpdates: boolean;
  };

  privacy: {
    showEarnings: boolean;
    showRates: boolean;
    showMetrics: boolean;
  };

  autoAcceptBrands?: UUID[];
  blockedBrands?: UUID[];
}

export interface CreatorAvailability {
  status: 'available' | 'busy' | 'unavailable';

  acceptingWork: boolean;

  unavailableDates?: { start: ISODateString; end: ISODateString }[];

  maxConcurrentCampaigns?: number;
  currentCampaigns?: number;

  responseTimeHours?: number;

  preferredContactMethod?: 'email' | 'in_app' | 'phone';
}

export interface CreatorBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: ISODateString;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface CreatorRating {
  overall: number;
  totalReviews: number;

  breakdown: {
    quality: number;
    communication: number;
    timeliness: number;
    professionalism: number;
    creativity: number;
  };

  recentReviews: CreatorReview[];
}

export interface CreatorReview extends BaseEntity {
  creatorId: UUID;
  campaignId: UUID;

  reviewerId: UUID;
  reviewerName: string;
  reviewerOrganization?: string;

  rating: number;

  breakdown?: {
    quality?: number;
    communication?: number;
    timeliness?: number;
    professionalism?: number;
    creativity?: number;
  };

  title?: string;
  comment?: string;

  isPublic: boolean;

  response?: {
    comment: string;
    respondedAt: ISODateString;
  };
}

export interface CreatorPaymentInfo {
  preferredMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'paystack';

  bankAccount?: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
    country: string;
  };

  paypalEmail?: string;
  stripeAccountId?: string;
  paystackSubaccountId?: string;

  taxInfo?: {
    taxId?: string;
    w9OnFile?: boolean;
    vatNumber?: string;
    country: string;
  };

  billingAddress?: Address;
}

// Creator Search & Discovery
export interface CreatorSearchParams {
  query?: string;

  platforms?: SocialPlatform[];
  niches?: string[];
  contentTypes?: string[];

  followerRange?: { min?: number; max?: number };
  engagementRateRange?: { min?: number; max?: number };

  priceRange?: { min?: number; max?: number };
  currency?: string;

  locations?: string[];
  languages?: string[];

  tiers?: CreatorTier[];

  verifiedOnly?: boolean;
  availableOnly?: boolean;

  sortBy?: 'relevance' | 'followers' | 'engagement' | 'price' | 'rating';
  sortOrder?: 'asc' | 'desc';

  page?: number;
  limit?: number;
}

export interface CreatorSearchResult {
  creator: Creator;
  matchScore: number;
  matchReasons?: string[];
}

// Creator Invitation
export interface CreatorInvitation extends BaseEntity {
  campaignId: UUID;
  creatorId: UUID;

  invitedBy: UUID;

  status: 'pending' | 'accepted' | 'declined' | 'expired';

  message?: string;
  proposedRate?: Money;

  expiresAt: ISODateString;

  respondedAt?: ISODateString;
  responseMessage?: string;
}

// Ambassador Program
export interface AmbassadorProgram extends BaseEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  status: Status;

  tiers: AmbassadorTier[];

  benefits: AmbassadorBenefit[];

  requirements: AmbassadorRequirements;

  metrics?: {
    totalAmbassadors: number;
    activeAmbassadors: number;
    totalContent: number;
    totalRevenue: Money;
  };
}

export interface AmbassadorTier {
  id: UUID;
  name: string;
  order: number;

  requirements: {
    minContent?: number;
    minRevenue?: number;
    minEngagement?: number;
    minMonths?: number;
  };

  benefits: string[];

  commission?: number;
  discountCode?: string;
}

export interface AmbassadorBenefit {
  id: UUID;
  name: string;
  description: string;
  type: 'discount' | 'product' | 'commission' | 'exclusive_access' | 'other';
  value?: string;
  tiers: UUID[];
}

export interface AmbassadorRequirements {
  minFollowers?: number;
  platforms?: SocialPlatform[];
  niches?: string[];
  applicationRequired: boolean;
}

export interface Ambassador extends BaseEntity {
  programId: UUID;
  creatorId: UUID;

  tierId: UUID;
  status: 'active' | 'inactive' | 'graduated';

  joinedAt: ISODateString;

  discountCode?: string;
  affiliateLink?: string;

  metrics: {
    totalContent: number;
    totalRevenue: Money;
    totalReferrals: number;
    commissionEarned: Money;
  };
}
