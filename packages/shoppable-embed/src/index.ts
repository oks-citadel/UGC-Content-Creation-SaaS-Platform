/**
 * @nexus/shoppable-embed
 * Embeddable shoppable widget for the NEXUS platform
 */

export { NexusShoppableEmbed } from './embed';
export { ShoppableGallery } from './gallery';
export { ProductOverlay } from './overlay';
export { CartManager } from './cart';
export { CheckoutManager } from './checkout';
export { ProductTagger } from './product-tag';

export type {
  Product,
  ProductVariant,
  ProductTag,
  CartItem,
  ShoppableConfig,
  GalleryConfig,
  GalleryItem,
  CheckoutOptions,
  EmbedOptions,
} from './types';
