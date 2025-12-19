/**
 * Predefined event types and helpers
 */

export const EventTypes = {
  // Page events
  PAGE_VIEW: 'page_view',
  PAGE_LEAVE: 'page_leave',

  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',

  // Content events
  CONTENT_VIEW: 'content_view',
  CONTENT_LIKE: 'content_like',
  CONTENT_SHARE: 'content_share',
  CONTENT_COMMENT: 'content_comment',

  // Video events
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_COMPLETE: 'video_complete',
  VIDEO_PROGRESS: 'video_progress',

  // Commerce events
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CHECKOUT_START: 'checkout_start',
  PURCHASE: 'purchase',

  // Campaign events
  CAMPAIGN_VIEW: 'campaign_view',
  CAMPAIGN_CLICK: 'campaign_click',
  CAMPAIGN_CONVERSION: 'campaign_conversion',

  // Interaction events
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  FORM_SUBMIT: 'form_submit',
  SEARCH: 'search',

  // Error events
  ERROR: 'error',
  API_ERROR: 'api_error',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

/**
 * Event helpers for common tracking scenarios
 */
export class EventHelpers {
  /**
   * Track video playback
   */
  static videoPlay(videoId: string, title?: string, duration?: number) {
    return {
      type: EventTypes.VIDEO_PLAY,
      properties: {
        videoId,
        title,
        duration,
      },
    };
  }

  /**
   * Track video progress
   */
  static videoProgress(
    videoId: string,
    progress: number,
    duration: number,
    milestone?: number
  ) {
    return {
      type: EventTypes.VIDEO_PROGRESS,
      properties: {
        videoId,
        progress,
        duration,
        milestone,
        percentComplete: (progress / duration) * 100,
      },
    };
  }

  /**
   * Track product view
   */
  static productView(productId: string, name: string, price: number, category?: string) {
    return {
      type: EventTypes.PRODUCT_VIEW,
      properties: {
        productId,
        name,
        price,
        category,
      },
    };
  }

  /**
   * Track add to cart
   */
  static addToCart(
    productId: string,
    name: string,
    price: number,
    quantity: number = 1
  ) {
    return {
      type: EventTypes.ADD_TO_CART,
      properties: {
        productId,
        name,
        price,
        quantity,
        value: price * quantity,
      },
    };
  }

  /**
   * Track purchase
   */
  static purchase(
    orderId: string,
    revenue: number,
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>,
    currency: string = 'USD'
  ) {
    return {
      type: EventTypes.PURCHASE,
      properties: {
        orderId,
        revenue,
        currency,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      },
    };
  }

  /**
   * Track search
   */
  static search(query: string, results?: number, category?: string) {
    return {
      type: EventTypes.SEARCH,
      properties: {
        query,
        results,
        category,
      },
    };
  }

  /**
   * Track content engagement
   */
  static contentView(contentId: string, contentType: string, title?: string) {
    return {
      type: EventTypes.CONTENT_VIEW,
      properties: {
        contentId,
        contentType,
        title,
      },
    };
  }

  /**
   * Track social share
   */
  static share(contentId: string, platform: string, contentType?: string) {
    return {
      type: EventTypes.CONTENT_SHARE,
      properties: {
        contentId,
        platform,
        contentType,
      },
    };
  }

  /**
   * Track errors
   */
  static error(message: string, code?: string, stack?: string) {
    return {
      type: EventTypes.ERROR,
      properties: {
        message,
        code,
        stack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };
  }

  /**
   * Track form submission
   */
  static formSubmit(formId: string, formName?: string, fields?: string[]) {
    return {
      type: EventTypes.FORM_SUBMIT,
      properties: {
        formId,
        formName,
        fields,
      },
    };
  }

  /**
   * Track button click
   */
  static buttonClick(buttonId: string, label?: string, category?: string) {
    return {
      type: EventTypes.BUTTON_CLICK,
      properties: {
        buttonId,
        label,
        category,
      },
    };
  }
}
