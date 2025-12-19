import type { Product, ProductTag } from './types';

/**
 * Product tagging on media
 */
export class ProductTagger {
  private mediaElement: HTMLElement;
  private products: Product[];
  private tags: ProductTag[] = [];
  private onTagCreate?: (tag: ProductTag) => void;

  constructor(
    mediaElement: HTMLElement,
    products: Product[],
    onTagCreate?: (tag: ProductTag) => void
  ) {
    this.mediaElement = mediaElement;
    this.products = products;
    this.onTagCreate = onTagCreate;
  }

  /**
   * Enable tagging mode
   */
  enableTagging(): void {
    this.mediaElement.style.cursor = 'crosshair';

    const clickHandler = (e: MouseEvent) => {
      const rect = this.mediaElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      this.showProductSelector(x, y);
    };

    this.mediaElement.addEventListener('click', clickHandler);

    // Store handler for cleanup
    (this.mediaElement as any)._tagClickHandler = clickHandler;
  }

  /**
   * Disable tagging mode
   */
  disableTagging(): void {
    this.mediaElement.style.cursor = '';

    const handler = (this.mediaElement as any)._tagClickHandler;
    if (handler) {
      this.mediaElement.removeEventListener('click', handler);
      delete (this.mediaElement as any)._tagClickHandler;
    }
  }

  /**
   * Add a tag
   */
  addTag(tag: ProductTag): void {
    this.tags.push(tag);
    this.renderTag(tag);
  }

  /**
   * Remove a tag
   */
  removeTag(tagId: string): void {
    this.tags = this.tags.filter((t) => t.id !== tagId);

    const tagElement = this.mediaElement.querySelector(`[data-tag-id="${tagId}"]`);
    if (tagElement) {
      tagElement.remove();
    }
  }

  /**
   * Get all tags
   */
  getTags(): ProductTag[] {
    return [...this.tags];
  }

  /**
   * Clear all tags
   */
  clearTags(): void {
    this.tags = [];
    this.mediaElement.querySelectorAll('.nexus-product-tag').forEach((el) => el.remove());
  }

  /**
   * Render existing tags
   */
  renderTags(tags: ProductTag[]): void {
    this.clearTags();
    this.tags = [...tags];
    tags.forEach((tag) => this.renderTag(tag));
  }

  // Private methods

  private showProductSelector(x: number, y: number): void {
    const selector = document.createElement('div');
    selector.className = 'nexus-product-selector';
    selector.style.position = 'fixed';
    selector.style.left = '50%';
    selector.style.top = '50%';
    selector.style.transform = 'translate(-50%, -50%)';

    const title = document.createElement('h3');
    title.textContent = 'Select Product';
    selector.appendChild(title);

    const productList = document.createElement('div');
    productList.className = 'nexus-product-list';

    this.products.forEach((product) => {
      const productItem = document.createElement('button');
      productItem.className = 'nexus-product-item';
      productItem.innerHTML = `
        <img src="${product.images[0]}" alt="${product.name}" />
        <div>
          <strong>${product.name}</strong>
          <span>${this.formatPrice(product.price, product.currency)}</span>
        </div>
      `;

      productItem.addEventListener('click', () => {
        this.createTag(product.id, x, y);
        selector.remove();
      });

      productList.appendChild(productItem);
    });

    selector.appendChild(productList);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'nexus-cancel-btn';
    cancelBtn.addEventListener('click', () => selector.remove());
    selector.appendChild(cancelBtn);

    document.body.appendChild(selector);
  }

  private createTag(productId: string, x: number, y: number): void {
    const tag: ProductTag = {
      id: `tag-${Date.now()}`,
      productId,
      x,
      y,
    };

    this.addTag(tag);
    this.onTagCreate?.(tag);
  }

  private renderTag(tag: ProductTag): void {
    const product = this.products.find((p) => p.id === tag.productId);
    if (!product) return;

    const tagElement = document.createElement('button');
    tagElement.className = 'nexus-product-tag';
    tagElement.dataset.tagId = tag.id;
    tagElement.style.position = 'absolute';
    tagElement.style.left = `${tag.x}%`;
    tagElement.style.top = `${tag.y}%`;
    tagElement.innerHTML = '🛍️';

    // Show product info on hover
    tagElement.addEventListener('mouseenter', () => {
      this.showProductTooltip(product, tagElement);
    });

    tagElement.addEventListener('mouseleave', () => {
      this.hideProductTooltip();
    });

    // Position relative container
    if (this.mediaElement.style.position !== 'relative') {
      this.mediaElement.style.position = 'relative';
    }

    this.mediaElement.appendChild(tagElement);
  }

  private showProductTooltip(product: Product, anchor: HTMLElement): void {
    const tooltip = document.createElement('div');
    tooltip.className = 'nexus-product-tooltip';
    tooltip.innerHTML = `
      <strong>${product.name}</strong>
      <span>${this.formatPrice(product.price, product.currency)}</span>
    `;

    const rect = anchor.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;

    document.body.appendChild(tooltip);

    // Store for cleanup
    (this as any)._currentTooltip = tooltip;
  }

  private hideProductTooltip(): void {
    const tooltip = (this as any)._currentTooltip;
    if (tooltip) {
      tooltip.remove();
      delete (this as any)._currentTooltip;
    }
  }

  private formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }
}
