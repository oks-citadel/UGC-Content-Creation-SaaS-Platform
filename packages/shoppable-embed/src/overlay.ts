import type { Product, ProductTag } from './types';

/**
 * Product overlay manager for shoppable media
 */
export class ProductOverlay {
  private container: HTMLElement;
  private mediaElement: HTMLElement;
  private products: Product[];
  private tags: ProductTag[];

  constructor(
    container: HTMLElement,
    mediaElement: HTMLElement,
    products: Product[],
    tags: ProductTag[]
  ) {
    this.container = container;
    this.mediaElement = mediaElement;
    this.products = products;
    this.tags = tags;

    this.setupOverlay();
  }

  /**
   * Render the overlay
   */
  render(): void {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'nexus-shoppable-overlay';

    // Render product tags
    this.tags.forEach((tag) => {
      const product = this.products.find((p) => p.id === tag.productId);
      if (!product) return;

      const tagElement = this.createTagElement(tag, product);
      overlay.appendChild(tagElement);
    });

    this.container.appendChild(overlay);
  }

  /**
   * Update tags
   */
  updateTags(tags: ProductTag[]): void {
    this.tags = tags;
    this.clearOverlay();
    this.render();
  }

  /**
   * Clear overlay
   */
  clearOverlay(): void {
    const overlay = this.container.querySelector('.nexus-shoppable-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Show product details
   */
  showProductDetails(product: Product): void {
    const modal = document.createElement('div');
    modal.className = 'nexus-product-modal';

    modal.innerHTML = `
      <div class="nexus-modal-backdrop"></div>
      <div class="nexus-modal-content">
        <button class="nexus-modal-close">×</button>
        <div class="nexus-product-details">
          <div class="nexus-product-gallery">
            ${product.images.map((img) => `<img src="${img}" alt="${product.name}" />`).join('')}
          </div>
          <div class="nexus-product-info">
            <h2>${product.name}</h2>
            <p class="nexus-product-price">${this.formatPrice(product.price, product.currency)}</p>
            ${product.description ? `<p class="nexus-product-description">${product.description}</p>` : ''}
            ${this.renderVariants(product)}
            <button class="nexus-add-to-cart-btn">Add to Cart</button>
            ${product.url ? `<a href="${product.url}" class="nexus-view-product-btn" target="_blank">View Full Details</a>` : ''}
          </div>
        </div>
      </div>
    `;

    // Close button handler
    const closeBtn = modal.querySelector('.nexus-modal-close') as HTMLElement;
    closeBtn?.addEventListener('click', () => modal.remove());

    // Backdrop click to close
    const backdrop = modal.querySelector('.nexus-modal-backdrop') as HTMLElement;
    backdrop?.addEventListener('click', () => modal.remove());

    // Add to cart handler
    const addToCartBtn = modal.querySelector('.nexus-add-to-cart-btn') as HTMLElement;
    addToCartBtn?.addEventListener('click', () => {
      const event = new CustomEvent('nexus:add-to-cart', {
        detail: {
          productId: product.id,
          quantity: 1,
          price: product.price,
        },
      });
      window.dispatchEvent(event);
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  // Private methods

  private setupOverlay(): void {
    // Make container position relative
    if (this.container.style.position !== 'relative') {
      this.container.style.position = 'relative';
    }
  }

  private createTagElement(tag: ProductTag, product: Product): HTMLElement {
    const tagElement = document.createElement('button');
    tagElement.className = 'nexus-product-tag';
    tagElement.style.left = `${tag.x}%`;
    tagElement.style.top = `${tag.y}%`;
    tagElement.innerHTML = `
      <span class="nexus-tag-pulse"></span>
      <span class="nexus-tag-icon">🛍️</span>
    `;

    // Click handler
    tagElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showProductDetails(product);
    });

    // Hover preview
    let hoverTimeout: NodeJS.Timeout;
    tagElement.addEventListener('mouseenter', () => {
      hoverTimeout = setTimeout(() => {
        this.showQuickPreview(product, tagElement);
      }, 300);
    });

    tagElement.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      this.hideQuickPreview();
    });

    return tagElement;
  }

  private showQuickPreview(product: Product, anchor: HTMLElement): void {
    const preview = document.createElement('div');
    preview.className = 'nexus-product-preview';
    preview.innerHTML = `
      <img src="${product.images[0]}" alt="${product.name}" />
      <div class="nexus-preview-info">
        <h4>${product.name}</h4>
        <p>${this.formatPrice(product.price, product.currency)}</p>
      </div>
    `;

    const rect = anchor.getBoundingClientRect();
    preview.style.position = 'fixed';
    preview.style.left = `${rect.right + 10}px`;
    preview.style.top = `${rect.top}px`;

    // Adjust if preview goes off-screen
    setTimeout(() => {
      const previewRect = preview.getBoundingClientRect();
      if (previewRect.right > window.innerWidth) {
        preview.style.left = `${rect.left - previewRect.width - 10}px`;
      }
      if (previewRect.bottom > window.innerHeight) {
        preview.style.top = `${window.innerHeight - previewRect.height - 10}px`;
      }
    }, 0);

    document.body.appendChild(preview);
    (this as any)._currentPreview = preview;
  }

  private hideQuickPreview(): void {
    const preview = (this as any)._currentPreview;
    if (preview) {
      preview.remove();
      delete (this as any)._currentPreview;
    }
  }

  private renderVariants(product: Product): string {
    if (!product.variants || product.variants.length === 0) {
      return '';
    }

    return `
      <div class="nexus-product-variants">
        <label>Options:</label>
        <select class="nexus-variant-select">
          ${product.variants
            .map(
              (variant) => `
            <option value="${variant.id}" ${!variant.available ? 'disabled' : ''}>
              ${variant.name} ${variant.price ? `- ${this.formatPrice(variant.price, product.currency)}` : ''}
              ${!variant.available ? '(Out of Stock)' : ''}
            </option>
          `
            )
            .join('')}
        </select>
      </div>
    `;
  }

  private formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }
}
