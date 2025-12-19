import { ShoppableGallery } from './gallery';
import { ProductOverlay } from './overlay';
import { CartManager } from './cart';
import { CheckoutManager } from './checkout';
import type { ShoppableConfig, EmbedOptions, GalleryConfig } from './types';

/**
 * Main embed SDK for shoppable content
 */
export class NexusShoppableEmbed {
  private config: EmbedOptions;
  private cart: CartManager;
  private checkout: CheckoutManager;

  constructor(config: EmbedOptions) {
    this.config = config;
    this.cart = new CartManager();
    this.checkout = new CheckoutManager(
      'https://api.nexus.app/v1',
      config.apiKey
    );

    this.setupGlobalHandlers();
  }

  /**
   * Create a shoppable gallery
   */
  createGallery(containerId: string, config: GalleryConfig): ShoppableGallery {
    const gallery = new ShoppableGallery(containerId, config);

    // Connect gallery to cart
    gallery.on('product:add-to-cart', (item) => {
      this.cart.addItem(item);
    });

    gallery.render();
    return gallery;
  }

  /**
   * Create a shoppable overlay on media
   */
  createOverlay(config: ShoppableConfig): ProductOverlay {
    const container = document.getElementById(config.containerId);
    if (!container) {
      throw new Error(`Container element with id "${config.containerId}" not found`);
    }

    const mediaElement = container.querySelector('img, video') as HTMLElement;
    if (!mediaElement) {
      throw new Error('No media element found in container');
    }

    const overlay = new ProductOverlay(
      container,
      mediaElement,
      config.products,
      config.tags || []
    );

    overlay.render();
    return overlay;
  }

  /**
   * Render shopping cart widget
   */
  renderCart(containerId: string, products: any[]): void {
    this.cart.renderWidget(containerId, products);

    // Handle checkout
    this.cart.on('checkout:requested', async (items) => {
      await this.checkout.redirectToCheckout({ items });
    });
  }

  /**
   * Get cart manager instance
   */
  getCart(): CartManager {
    return this.cart;
  }

  /**
   * Get checkout manager instance
   */
  getCheckout(): CheckoutManager {
    return this.checkout;
  }

  /**
   * Generate embed code for integration
   */
  generateEmbedCode(galleryId: string, options: Partial<GalleryConfig> = {}): string {
    const scriptUrl = 'https://cdn.nexus.app/embed/latest/nexus-shoppable.js';
    const styleUrl = 'https://cdn.nexus.app/embed/latest/nexus-shoppable.css';

    return `
<!-- NEXUS Shoppable Gallery Embed -->
<div id="nexus-gallery-${galleryId}"></div>
<link rel="stylesheet" href="${styleUrl}" />
<script src="${scriptUrl}"></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    var nexus = new NexusShoppableEmbed({
      apiKey: '${this.config.apiKey}',
      theme: '${this.config.theme || 'light'}',
      language: '${this.config.language || 'en'}',
      currency: '${this.config.currency || 'USD'}'
    });

    nexus.createGallery('nexus-gallery-${galleryId}', {
      layout: '${options.layout || 'grid'}',
      columns: ${options.columns || 3},
      items: [] // Fetched from API
    });
  });
</script>
    `.trim();
  }

  /**
   * Generate inline script embed code
   */
  generateInlineEmbed(galleryId: string, items: any[]): string {
    const scriptUrl = 'https://cdn.nexus.app/embed/latest/nexus-shoppable.js';
    const styleUrl = 'https://cdn.nexus.app/embed/latest/nexus-shoppable.css';

    return `
<!-- NEXUS Shoppable Gallery -->
<div id="nexus-gallery-${galleryId}"></div>
<link rel="stylesheet" href="${styleUrl}" />
<script src="${scriptUrl}"></script>
<script>
  (function() {
    var nexus = new NexusShoppableEmbed({
      apiKey: '${this.config.apiKey}'
    });

    nexus.createGallery('nexus-gallery-${galleryId}', {
      layout: 'grid',
      items: ${JSON.stringify(items)}
    });
  })();
</script>
    `.trim();
  }

  // Private methods

  private setupGlobalHandlers(): void {
    // Listen for add-to-cart events
    window.addEventListener('nexus:add-to-cart', (e: any) => {
      this.cart.addItem(e.detail);
    });

    // Listen for checkout events
    window.addEventListener('nexus:checkout', async (e: any) => {
      const items = e.detail.items || this.cart.getItems();
      await this.checkout.redirectToCheckout({ items });
    });
  }
}

// Export for browser global usage
if (typeof window !== 'undefined') {
  (window as any).NexusShoppableEmbed = NexusShoppableEmbed;
}
