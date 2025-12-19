import { Creator, CreatorMetrics, CreatorEarnings, CreatorVerification } from '@prisma/client';

export interface CreatorWithRelations extends Creator {
  metrics?: CreatorMetrics | null;
  earnings?: CreatorEarnings | null;
  verification?: CreatorVerification | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  code?: string;
}

export interface CreatorFilters {
  status?: string;
  verificationStatus?: string;
  primaryNiche?: string;
  country?: string;
  minReputationScore?: number;
  search?: string;
}

export interface MetricsUpdate {
  totalFollowers?: number;
  instagramFollowers?: number;
  tiktokFollowers?: number;
  youtubeSubscribers?: number;
  twitterFollowers?: number;
  facebookFollowers?: number;
  avgEngagementRate?: number;
  avgLikesPerPost?: number;
  avgCommentsPerPost?: number;
  avgViews?: number;
  audienceAge?: Record<string, number>;
  audienceGender?: Record<string, number>;
  audienceLocation?: Record<string, number>;
}

export interface EarningsUpdate {
  totalEarned?: number;
  availableBalance?: number;
  pendingBalance?: number;
  withdrawnBalance?: number;
}

export interface VerificationUpdate {
  identityStatus?: string;
  idDocumentType?: string;
  idDocumentUrl?: string;
  instagramVerified?: boolean;
  tiktokVerified?: boolean;
  youtubeVerified?: boolean;
  twitterVerified?: boolean;
  businessName?: string;
  businessTaxId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}
