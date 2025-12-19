/**
 * @nexus/analytics-sdk
 * Analytics and tracking client SDK for the NEXUS platform
 */

export { AnalyticsTracker } from './tracker';
export { AttributionTracker } from './attribution';
export { EventHelpers, EventTypes } from './events';
export { SessionManager } from './session';
export { IdentityManager } from './identity';
export { StorageManager } from './storage';
export { Transport } from './transport';

export type {
  AnalyticsConfig,
  AnalyticsEvent,
  TrackingEvent,
  PageViewEvent,
  UserIdentity,
  SessionData,
  AttributionData,
  ConversionEvent,
  AnalyticsTransport,
  EventCallback,
} from './types';

export type { EventType } from './events';
