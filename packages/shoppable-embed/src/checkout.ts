import type { CartItem, CheckoutOptions } from './types';

/**
 * Checkout flow handler
 */
export class CheckoutManager {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Create a checkout session
   */
  async createCheckout(options: CheckoutOptions): Promise<{ url: string; sessionId: string }> {
    const response = await fetch(`${this.apiUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        items: options.items,
        successUrl: options.redirectUrl || window.location.href,
        cancelUrl: window.location.href,
        customerEmail: options.customerEmail,
        metadata: options.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    return response.json();
  }

  /**
   * Redirect to checkout
   */
  async redirectToCheckout(options: CheckoutOptions): Promise<void> {
    const { url } = await this.createCheckout(options);
    window.location.href = url;
  }

  /**
   * Open checkout in popup
   */
  async openCheckoutPopup(options: CheckoutOptions): Promise<Window | null> {
    const { url } = await this.createCheckout(options);

    const popup = window.open(
      url,
      'checkout',
      'width=600,height=800,scrollbars=yes,resizable=yes'
    );

    // Monitor popup for completion
    if (popup) {
      this.monitorCheckoutPopup(popup);
    }

    return popup;
  }

  /**
   * Embed checkout inline
   */
  async embedCheckout(containerId: string, options: CheckoutOptions): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    const { url } = await this.createCheckout(options);

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.className = 'nexus-checkout-iframe';
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';

    container.innerHTML = '';
    container.appendChild(iframe);
  }

  // Private methods

  private monitorCheckoutPopup(popup: Window): void {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        this.handleCheckoutComplete();
      }
    }, 500);
  }

  private handleCheckoutComplete(): void {
    // Emit custom event for checkout completion
    const event = new CustomEvent('nexus:checkout:complete');
    window.dispatchEvent(event);
  }
}
