export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface DateRangeParams {
  start_date?: Date;
  end_date?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    page?: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
}

export interface ShopifyCredentials {
  shopName: string;
  apiKey: string;
  password: string;
  apiVersion?: string;
}

export interface WooCommerceCredentials {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface AttributionWeight {
  touchpoint: number;
  weight: number;
}

export interface TrackingContext {
  session_id?: string;
  user_id?: string;
  customer_id?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  user_agent?: string;
  ip_address?: string;
  device_type?: string;
}
