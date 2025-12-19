/**
 * Shoppable embed types
 */

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  variants?: ProductVariant[];
  url?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: Record<string, string>;
  price?: number;
  available: boolean;
}

export interface ProductTag {
  id: string;
  productId: string;
  x: number;
  y: number;
  timestamp?: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface ShoppableConfig {
  containerId: string;
  products: Product[];
  tags?: ProductTag[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  checkoutUrl?: string;
  currency?: string;
  theme?: 'light' | 'dark';
  autoOpen?: boolean;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (item: CartItem) => void;
  onCheckout?: (items: CartItem[]) => void;
}

export interface GalleryConfig {
  items: GalleryItem[];
  layout: 'grid' | 'carousel' | 'masonry';
  columns?: number;
  aspectRatio?: string;
  onClick?: (item: GalleryItem) => void;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  products: Product[];
  tags?: ProductTag[];
}

export interface CheckoutOptions {
  items: CartItem[];
  redirectUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

export interface EmbedOptions {
  apiKey: string;
  theme?: 'light' | 'dark';
  language?: string;
  currency?: string;
}
