import EventEmitter from 'eventemitter3';
import type { GalleryConfig, GalleryItem, Product } from './types';

/**
 * Shoppable gallery renderer
 */
export class ShoppableGallery extends EventEmitter {
  private container: HTMLElement;
  private config: GalleryConfig;

  constructor(containerId: string, config: GalleryConfig) {
    super();

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    this.container = container;
    this.config = config;
  }

  /**
   * Render the gallery
   */
  render(): void {
    this.container.innerHTML = '';
    this.container.className = `nexus-gallery nexus-gallery-${this.config.layout}`;

    const galleryWrapper = document.createElement('div');
    galleryWrapper.className = 'nexus-gallery-wrapper';

    if (this.config.layout === 'grid') {
      this.renderGrid(galleryWrapper);
    } else if (this.config.layout === 'carousel') {
      this.renderCarousel(galleryWrapper);
    } else if (this.config.layout === 'masonry') {
      this.renderMasonry(galleryWrapper);
    }

    this.container.appendChild(galleryWrapper);
  }

  /**
   * Update gallery items
   */
  updateItems(items: GalleryItem[]): void {
    this.config.items = items;
    this.render();
  }

  /**
   * Destroy the gallery
   */
  destroy(): void {
    this.container.innerHTML = '';
    this.removeAllListeners();
  }

  // Private rendering methods

  private renderGrid(wrapper: HTMLElement): void {
    wrapper.style.display = 'grid';
    wrapper.style.gridTemplateColumns = `repeat(${this.config.columns || 3}, 1fr)`;
    wrapper.style.gap = '16px';

    this.config.items.forEach((item) => {
      const itemElement = this.createGalleryItem(item);
      wrapper.appendChild(itemElement);
    });
  }

  private renderCarousel(wrapper: HTMLElement): void {
    wrapper.style.display = 'flex';
    wrapper.style.overflowX = 'auto';
    wrapper.style.gap = '16px';
    wrapper.style.scrollSnapType = 'x mandatory';

    this.config.items.forEach((item) => {
      const itemElement = this.createGalleryItem(item);
      itemElement.style.scrollSnapAlign = 'start';
      itemElement.style.flexShrink = '0';
      wrapper.appendChild(itemElement);
    });

    // Add navigation buttons
    this.addCarouselControls(wrapper);
  }

  private renderMasonry(wrapper: HTMLElement): void {
    wrapper.style.columnCount = (this.config.columns || 3).toString();
    wrapper.style.columnGap = '16px';

    this.config.items.forEach((item) => {
      const itemElement = this.createGalleryItem(item);
      itemElement.style.breakInside = 'avoid';
      itemElement.style.marginBottom = '16px';
      wrapper.appendChild(itemElement);
    });
  }

  private createGalleryItem(item: GalleryItem): HTMLElement {
    const itemElement = document.createElement('div');
    itemElement.className = 'nexus-gallery-item';
    itemElement.dataset.itemId = item.id;

    // Media element
    const mediaElement = this.createMediaElement(item);
    itemElement.appendChild(mediaElement);

    // Product tags overlay
    if (item.tags && item.tags.length > 0) {
      const tagsOverlay = this.createTagsOverlay(item);
      itemElement.appendChild(tagsOverlay);
    }

    // Click handler
    itemElement.addEventListener('click', () => {
      this.config.onClick?.(item);
      this.emit('item:click', item);
    });

    return itemElement;
  }

  private createMediaElement(item: GalleryItem): HTMLElement {
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.url;
      video.poster = item.thumbnail;
      video.className = 'nexus-gallery-media';
      video.controls = false;
      video.muted = true;
      video.loop = true;

      // Play on hover
      video.addEventListener('mouseenter', () => video.play());
      video.addEventListener('mouseleave', () => video.pause());

      return video;
    } else {
      const img = document.createElement('img');
      img.src = item.thumbnail || item.url;
      img.alt = `Gallery item ${item.id}`;
      img.className = 'nexus-gallery-media';
      return img;
    }
  }

  private createTagsOverlay(item: GalleryItem): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'nexus-gallery-tags';

    item.tags?.forEach((tag) => {
      const product = item.products.find((p) => p.id === tag.productId);
      if (!product) return;

      const tagElement = document.createElement('button');
      tagElement.className = 'nexus-product-tag';
      tagElement.style.left = `${tag.x}%`;
      tagElement.style.top = `${tag.y}%`;
      tagElement.innerHTML = '🛍️';

      tagElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showProductPopup(product, tagElement);
      });

      overlay.appendChild(tagElement);
    });

    return overlay;
  }

  private showProductPopup(product: Product, anchor: HTMLElement): void {
    // Remove existing popups
    document.querySelectorAll('.nexus-product-popup').forEach((el) => el.remove());

    const popup = document.createElement('div');
    popup.className = 'nexus-product-popup';

    popup.innerHTML = `
      <div class="nexus-product-image">
        <img src="${product.images[0]}" alt="${product.name}" />
      </div>
      <div class="nexus-product-info">
        <h3>${product.name}</h3>
        <p class="nexus-product-price">${this.formatPrice(product.price, product.currency)}</p>
        ${product.description ? `<p class="nexus-product-description">${product.description}</p>` : ''}
        <button class="nexus-add-to-cart-btn">Add to Cart</button>
      </div>
    `;

    // Position popup
    const rect = anchor.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 10}px`;

    // Add to cart handler
    const addToCartBtn = popup.querySelector('.nexus-add-to-cart-btn') as HTMLButtonElement;
    addToCartBtn?.addEventListener('click', () => {
      this.emit('product:add-to-cart', {
        productId: product.id,
        quantity: 1,
        price: product.price,
      });
      popup.remove();
    });

    // Close on outside click
    const closePopup = (e: MouseEvent) => {
      if (!popup.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closePopup);
    }, 0);

    document.body.appendChild(popup);
    this.emit('product:popup', product);
  }

  private addCarouselControls(wrapper: HTMLElement): void {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'nexus-carousel-prev';
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', () => {
      wrapper.scrollBy({ left: -300, behavior: 'smooth' });
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'nexus-carousel-next';
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', () => {
      wrapper.scrollBy({ left: 300, behavior: 'smooth' });
    });

    this.container.appendChild(prevBtn);
    this.container.appendChild(nextBtn);
  }

  private formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }
}
