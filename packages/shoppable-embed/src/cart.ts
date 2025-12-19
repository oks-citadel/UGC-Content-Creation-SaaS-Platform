import EventEmitter from 'eventemitter3';
import type { CartItem, Product } from './types';

/**
 * Shopping cart manager
 */
export class CartManager extends EventEmitter {
  private static readonly CART_KEY = 'nexus_cart';
  private items: CartItem[] = [];

  constructor() {
    super();
    this.loadCart();
  }

  /**
   * Add item to cart
   */
  addItem(item: CartItem): void {
    const existingItem = this.items.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.push(item);
    }

    this.saveCart();
    this.emit('cart:updated', this.items);
    this.emit('item:added', item);
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: string, variantId?: string): void {
    const index = this.items.findIndex(
      (i) => i.productId === productId && i.variantId === variantId
    );

    if (index !== -1) {
      const removed = this.items.splice(index, 1)[0];
      this.saveCart();
      this.emit('cart:updated', this.items);
      this.emit('item:removed', removed);
    }
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number, variantId?: string): void {
    const item = this.items.find(
      (i) => i.productId === productId && i.variantId === variantId
    );

    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId, variantId);
      } else {
        item.quantity = quantity;
        this.saveCart();
        this.emit('cart:updated', this.items);
        this.emit('item:updated', item);
      }
    }
  }

  /**
   * Get all cart items
   */
  getItems(): CartItem[] {
    return [...this.items];
  }

  /**
   * Get cart item count
   */
  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get cart total
   */
  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Clear cart
   */
  clear(): void {
    this.items = [];
    this.saveCart();
    this.emit('cart:updated', this.items);
    this.emit('cart:cleared');
  }

  /**
   * Render cart widget
   */
  renderWidget(containerId: string, products: Product[]): void {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    container.className = 'nexus-cart-widget';

    const itemCount = this.getItemCount();
    const total = this.getTotal();

    container.innerHTML = `
      <button class="nexus-cart-toggle">
        <span class="nexus-cart-icon">🛒</span>
        ${itemCount > 0 ? `<span class="nexus-cart-badge">${itemCount}</span>` : ''}
      </button>
      <div class="nexus-cart-dropdown" style="display: none;">
        <div class="nexus-cart-header">
          <h3>Shopping Cart</h3>
          <button class="nexus-cart-close">×</button>
        </div>
        <div class="nexus-cart-items">
          ${this.items.length === 0 ? '<p class="nexus-cart-empty">Your cart is empty</p>' : this.renderCartItems(products)}
        </div>
        ${this.items.length > 0 ? `
          <div class="nexus-cart-footer">
            <div class="nexus-cart-total">
              <strong>Total:</strong>
              <span>${this.formatPrice(total)}</span>
            </div>
            <button class="nexus-checkout-btn">Proceed to Checkout</button>
          </div>
        ` : ''}
      </div>
    `;

    this.attachCartHandlers(container);
  }

  // Private methods

  private renderCartItems(products: Product[]): string {
    return this.items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return '';

        return `
        <div class="nexus-cart-item" data-product-id="${item.productId}" data-variant-id="${item.variantId || ''}">
          <img src="${product.images[0]}" alt="${product.name}" />
          <div class="nexus-cart-item-info">
            <h4>${product.name}</h4>
            <p>${this.formatPrice(item.price)}</p>
            <div class="nexus-quantity-controls">
              <button class="nexus-qty-decrease">-</button>
              <input type="number" value="${item.quantity}" min="1" class="nexus-qty-input" />
              <button class="nexus-qty-increase">+</button>
            </div>
          </div>
          <button class="nexus-remove-item">×</button>
        </div>
      `;
      })
      .join('');
  }

  private attachCartHandlers(container: HTMLElement): void {
    const toggle = container.querySelector('.nexus-cart-toggle') as HTMLElement;
    const dropdown = container.querySelector('.nexus-cart-dropdown') as HTMLElement;
    const close = container.querySelector('.nexus-cart-close') as HTMLElement;

    toggle?.addEventListener('click', () => {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    close?.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    // Quantity controls
    container.querySelectorAll('.nexus-qty-decrease').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('.nexus-cart-item') as HTMLElement;
        const input = item?.querySelector('.nexus-qty-input') as HTMLInputElement;
        if (input && parseInt(input.value) > 1) {
          const newQty = parseInt(input.value) - 1;
          input.value = newQty.toString();
          this.updateQuantity(
            item.dataset.productId!,
            newQty,
            item.dataset.variantId || undefined
          );
        }
      });
    });

    container.querySelectorAll('.nexus-qty-increase').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('.nexus-cart-item') as HTMLElement;
        const input = item?.querySelector('.nexus-qty-input') as HTMLInputElement;
        if (input) {
          const newQty = parseInt(input.value) + 1;
          input.value = newQty.toString();
          this.updateQuantity(
            item.dataset.productId!,
            newQty,
            item.dataset.variantId || undefined
          );
        }
      });
    });

    // Remove item
    container.querySelectorAll('.nexus-remove-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('.nexus-cart-item') as HTMLElement;
        if (item) {
          this.removeItem(item.dataset.productId!, item.dataset.variantId || undefined);
        }
      });
    });

    // Checkout button
    const checkoutBtn = container.querySelector('.nexus-checkout-btn') as HTMLElement;
    checkoutBtn?.addEventListener('click', () => {
      this.emit('checkout:requested', this.items);
    });
  }

  private loadCart(): void {
    try {
      const data = localStorage.getItem(CartManager.CART_KEY);
      if (data) {
        this.items = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }

  private saveCart(): void {
    try {
      localStorage.setItem(CartManager.CART_KEY, JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
}
