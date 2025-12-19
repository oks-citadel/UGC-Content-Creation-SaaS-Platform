export const CREATOR_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
} as const;

export const VERIFICATION_STATUS = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export const PAYOUT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export const SOCIAL_PLATFORMS = {
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  YOUTUBE: 'YOUTUBE',
  TWITTER: 'TWITTER',
  FACEBOOK: 'FACEBOOK',
  LINKEDIN: 'LINKEDIN',
  TWITCH: 'TWITCH',
} as const;

export const PORTFOLIO_MEDIA_TYPES = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  LINK: 'LINK',
} as const;

export const CONTENT_NICHES = [
  'fashion',
  'beauty',
  'fitness',
  'food',
  'travel',
  'tech',
  'gaming',
  'lifestyle',
  'parenting',
  'pets',
  'home',
  'business',
  'education',
  'entertainment',
  'sports',
  'health',
  'art',
  'music',
  'photography',
  'automotive',
  'finance',
  'comedy',
  'diy',
  'crafts',
  'other',
] as const;

export const CONTENT_TYPES = [
  'photo',
  'video',
  'reel',
  'story',
  'carousel',
  'blog',
  'vlog',
  'podcast',
  'livestream',
  'review',
  'tutorial',
  'unboxing',
  'challenge',
  'collaboration',
] as const;

export const LANGUAGES = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'ru', // Russian
  'ja', // Japanese
  'ko', // Korean
  'zh', // Chinese
  'ar', // Arabic
  'hi', // Hindi
  'nl', // Dutch
  'sv', // Swedish
  'pl', // Polish
  'tr', // Turkish
] as const;

export const PAYOUT_METHODS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  WISE: 'wise',
} as const;

export const ID_DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  DRIVERS_LICENSE: 'drivers_license',
  NATIONAL_ID: 'national_id',
} as const;

// Matching algorithm weights
export const MATCHING_WEIGHTS = {
  NICHE: 0.30,
  FOLLOWERS: 0.25,
  ENGAGEMENT: 0.25,
  REPUTATION: 0.15,
  LOCATION: 0.10,
  BUDGET: 0.05,
} as const;

// Reputation score weights
export const REPUTATION_WEIGHTS = {
  REVIEWS: 0.40,
  SUCCESS_RATE: 0.30,
  RESPONSE_RATE: 0.20,
  VERIFICATION: 0.10,
} as const;

// Default values
export const DEFAULTS = {
  MIN_FOLLOWERS: 1000,
  MIN_ENGAGEMENT_RATE: 0.01,
  MIN_PAYOUT_AMOUNT: 50.0,
  PAYOUT_PROCESSING_FEE: 2.5,
  MAX_RECOMMENDATION_COUNT: 20,
  PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
  REPUTATION_SCALE: 5,
} as const;

// Rate limits
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  STRICT: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 20,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 5,
  },
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  PAYOUT_FAILED: 'PAYOUT_FAILED',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATOR_CREATED: 'Creator profile created successfully',
  CREATOR_UPDATED: 'Creator profile updated successfully',
  CREATOR_DELETED: 'Creator profile deleted successfully',
  PORTFOLIO_ADDED: 'Portfolio item added successfully',
  PORTFOLIO_UPDATED: 'Portfolio item updated successfully',
  PORTFOLIO_DELETED: 'Portfolio item deleted successfully',
  PAYOUT_REQUESTED: 'Payout requested successfully',
  VERIFICATION_SUBMITTED: 'Verification submitted successfully',
  VERIFIED: 'Creator verified successfully',
  REVIEW_RESPONDED: 'Review response submitted successfully',
} as const;
