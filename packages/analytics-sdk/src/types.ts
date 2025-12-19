/**
 * Analytics SDK Types
 */

export interface AnalyticsConfig {
  apiKey: string;
  apiUrl?: string;
  debug?: boolean;
  autoTrack?: boolean;
  flushInterval?: number;
  maxBatchSize?: number;
  sessionTimeout?: number;
  persistSession?: boolean;
}

export interface AnalyticsEvent {
  type: string;
  properties?: Record<string, any>;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
  anonymousId?: string;
}

export interface TrackingEvent extends AnalyticsEvent {
  id: string;
  category?: string;
  label?: string;
  value?: number;
}

export interface PageViewEvent {
  url: string;
  title: string;
  referrer?: string;
  timestamp: number;
}

export interface UserIdentity {
  userId: string;
  traits?: Record<string, any>;
  timestamp: number;
}

export interface SessionData {
  id: string;
  startTime: number;
  lastActivityTime: number;
  pageViews: number;
  events: number;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export interface AttributionData {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  landingPage?: string;
  timestamp: number;
}

export interface ConversionEvent {
  type: string;
  value?: number;
  currency?: string;
  revenue?: number;
  items?: Array<{
    id: string;
    name: string;
    category?: string;
    price?: number;
    quantity?: number;
  }>;
  properties?: Record<string, any>;
}

export interface AnalyticsTransport {
  send(events: TrackingEvent[]): Promise<void>;
}

export type EventCallback = (event: TrackingEvent) => void;
