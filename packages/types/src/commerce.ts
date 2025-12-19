// =============================================================================
// Commerce Types - Shoppable UGC & E-commerce Integration
// =============================================================================

import type {
  UUID,
  ISODateString,
  BaseEntity,
  AuditableEntity,
  Status,
  Money,
  Image,
} from './common';

export type StoreProvider = 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'custom';

export interface Store extends BaseEntity {
  organizationId: UUID;

  name: string;
  provider: StoreProvider;

  status: Status;

  credentials: StoreCredentials;

  settings: StoreSettings;

  syncStatus: {
    lastSyncedAt?: ISODateString;
    productsCount: number;
    ordersCount: number;
    status: 'idle' | 'syncing' | 'error';
    error?: string;
  };

  domain?: string;
  currency: string;
}

export interface StoreCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  storeUrl?: string;
  webhookSecret?: string;
}

export interface StoreSettings {
  autoSync: boolean;
  syncInterval: number;

  syncProducts: boolean;
  syncOrders: boolean;
  syncInventory: boolean;

  defaultCurrency: string;

  attributionWindow: number;
}

export interface Product extends BaseEntity {
  organizationId: UUID;
  storeId: UUID;

  externalId: string;

  name: string;
  description?: string;
  shortDescription?: string;

  status: 'active' | 'draft' | 'archived';

  images: Image[];

  price: Money;
  compareAtPrice?: Money;

  sku?: string;
  barcode?: string;

  inventory?: {
    tracked: boolean;
    quantity?: number;
    policy: 'deny' | 'continue';
  };

  variants?: ProductVariant[];

  categories?: string[];
  tags?: string[];

  vendor?: string;
  brand?: string;

  url: string;

  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  ugcCount: number;
  avgRating?: number;
  reviewCount?: number;

  metadata?: Record<string, unknown>;
}

export interface ProductVariant {
  id: UUID;
  externalId: string;

  name: string;

  price: Money;
  compareAtPrice?: Money;

  sku?: string;
  barcode?: string;

  options: { name: string; value: string }[];

  image?: Image;

  inventory?: {
    quantity?: number;
    policy: 'deny' | 'continue';
  };
}

// Shoppable Gallery
export interface ShoppableGallery extends AuditableEntity {
  organizationId: UUID;

  name: string;
  description?: string;

  type: 'curated' | 'ugc' | 'mixed' | 'product';

  status: Status;

  layout: GalleryLayout;

  styling: GalleryStyling;

  content: GalleryContent;

  settings: GallerySettings;

  embedCode?: string;

  analytics?: GalleryAnalytics;
}

export interface GalleryLayout {
  type: 'grid' | 'carousel' | 'masonry' | 'slider' | 'stack';

  columns?: number;
  rows?: number;

  gap: number;

  itemAspectRatio?: string;

  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;

  responsive?: {
    mobile: Partial<GalleryLayout>;
    tablet: Partial<GalleryLayout>;
  };
}

export interface GalleryStyling {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;

  itemStyle?: {
    borderRadius?: number;
    shadow?: boolean;
    hoverEffect?: 'zoom' | 'overlay' | 'none';
  };

  fontFamily?: string;
  primaryColor?: string;
  secondaryColor?: string;

  customCSS?: string;
}

export interface GalleryContent {
  mode: 'manual' | 'dynamic';

  manualItems?: GalleryItem[];

  dynamicFilters?: {
    contentIds?: UUID[];
    productIds?: UUID[];
    campaignIds?: UUID[];
    creatorIds?: UUID[];
    tags?: string[];
    minEngagement?: number;
    maxItems?: number;
    sortBy?: 'recent' | 'popular' | 'engagement';
  };
}

export interface GalleryItem {
  id: UUID;
  type: 'content' | 'product';

  contentId?: UUID;
  productId?: UUID;

  order: number;

  customTitle?: string;
  customDescription?: string;

  productTags?: ProductTag[];
}

export interface ProductTag {
  id: UUID;
  productId: UUID;

  position: {
    x: number;
    y: number;
  };

  timestamp?: number;

  style?: 'dot' | 'icon' | 'label';
}

export interface GallerySettings {
  enableShopping: boolean;
  showProductInfo: boolean;
  showPrices: boolean;
  showAddToCart: boolean;

  enableLightbox: boolean;
  enableSharing: boolean;

  clickAction: 'lightbox' | 'product_page' | 'quick_view';

  tracking: {
    enabled: boolean;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export interface GalleryAnalytics {
  views: number;
  uniqueViews: number;

  interactions: number;
  clickThroughRate: number;

  productClicks: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;

  revenue: Money;
  conversionRate: number;

  avgTimeOnGallery: number;

  topProducts: { productId: UUID; clicks: number; revenue: Money }[];
  topContent: { contentId: UUID; clicks: number; engagement: number }[];

  byDate: GalleryAnalyticsTimeline[];
}

export interface GalleryAnalyticsTimeline {
  date: ISODateString;
  views: number;
  clicks: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
}

// Orders & Attribution
export interface Order extends BaseEntity {
  organizationId: UUID;
  storeId: UUID;

  externalId: string;

  customer: OrderCustomer;

  items: OrderItem[];

  subtotal: Money;
  discounts: Money;
  shipping: Money;
  tax: Money;
  total: Money;

  status: OrderStatus;

  fulfillmentStatus?: 'unfulfilled' | 'partial' | 'fulfilled';

  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial_refund';

  attribution?: OrderAttribution;

  createdAt: ISODateString;
  updatedAt: ISODateString;

  metadata?: Record<string, unknown>;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderCustomer {
  id?: UUID;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  isNewCustomer?: boolean;
}

export interface OrderItem {
  id: UUID;
  productId: UUID;
  variantId?: UUID;

  name: string;
  sku?: string;

  quantity: number;
  price: Money;
  total: Money;

  image?: Image;

  attribution?: ItemAttribution;
}

export interface OrderAttribution {
  source: 'direct' | 'gallery' | 'creator' | 'campaign' | 'email' | 'ad' | 'organic';

  galleryId?: UUID;
  contentId?: UUID;
  creatorId?: UUID;
  campaignId?: UUID;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  referrer?: string;

  touchpoints?: AttributionTouchpoint[];

  model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';
}

export interface ItemAttribution {
  contentId?: UUID;
  creatorId?: UUID;
  galleryId?: UUID;
}

export interface AttributionTouchpoint {
  timestamp: ISODateString;
  type: 'view' | 'click' | 'add_to_cart' | 'checkout';
  source: string;
  contentId?: UUID;
  galleryId?: UUID;
  campaignId?: UUID;
}

// Checkout Experience
export interface CheckoutConfig extends BaseEntity {
  organizationId: UUID;

  name: string;
  status: Status;

  type: 'embedded' | 'modal' | 'redirect';

  styling: CheckoutStyling;

  settings: CheckoutSettings;

  domains: string[];
}

export interface CheckoutStyling {
  primaryColor: string;
  backgroundColor: string;
  fontFamily?: string;
  borderRadius?: number;
  logo?: Image;
  customCSS?: string;
}

export interface CheckoutSettings {
  enableGuestCheckout: boolean;
  requirePhone: boolean;

  shippingMethods: ShippingMethod[];

  paymentMethods: ('card' | 'paypal' | 'apple_pay' | 'google_pay')[];

  enableDiscountCodes: boolean;
  enableGiftCards: boolean;

  termsUrl?: string;
  privacyUrl?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: Money;
  estimatedDays?: string;
}

// Analytics & Reporting
export interface CommerceAnalytics {
  overview: {
    totalRevenue: Money;
    totalOrders: number;
    avgOrderValue: Money;
    conversionRate: number;
    attributedRevenue: Money;
    attributedOrders: number;
  };

  bySource: SourceAnalytics[];
  byCreator: CreatorCommerceAnalytics[];
  byContent: ContentCommerceAnalytics[];
  byProduct: ProductAnalytics[];
  byGallery: GalleryCommerceAnalytics[];

  timeline: CommerceTimelineAnalytics[];
}

export interface SourceAnalytics {
  source: string;
  revenue: Money;
  orders: number;
  avgOrderValue: Money;
  conversionRate: number;
}

export interface CreatorCommerceAnalytics {
  creatorId: UUID;
  creatorName: string;
  revenue: Money;
  orders: number;
  products: number;
  conversionRate: number;
}

export interface ContentCommerceAnalytics {
  contentId: UUID;
  revenue: Money;
  clicks: number;
  orders: number;
  conversionRate: number;
}

export interface ProductAnalytics {
  productId: UUID;
  productName: string;
  revenue: Money;
  unitsSold: number;
  views: number;
  conversionRate: number;
}

export interface GalleryCommerceAnalytics {
  galleryId: UUID;
  galleryName: string;
  revenue: Money;
  orders: number;
  views: number;
  conversionRate: number;
}

export interface CommerceTimelineAnalytics {
  date: ISODateString;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  attributedRevenue: number;
}
