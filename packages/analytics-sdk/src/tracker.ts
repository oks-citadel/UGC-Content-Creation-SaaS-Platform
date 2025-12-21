import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import type {
  AnalyticsConfig,
  TrackingEvent,
  PageViewEvent,
  ConversionEvent,
  EventCallback,
} from './types';
import { SessionManager } from './session';
import { IdentityManager } from './identity';
import { StorageManager } from './storage';
import { Transport } from './transport';

/**
 * Main analytics tracker class
 */
export class AnalyticsTracker extends EventEmitter {
  private config: Required<AnalyticsConfig>;
  private session: SessionManager;
  private identity: IdentityManager;
  private storage: StorageManager;
  private transport: Transport;
  private eventQueue: TrackingEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: AnalyticsConfig) {
    super();

    this.config = {
      apiUrl: 'https://analytics.nexus.app/api/v1',
      debug: false,
      autoTrack: true,
      flushInterval: 5000,
      maxBatchSize: 50,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      persistSession: true,
      ...config,
    };

    this.storage = new StorageManager();
    this.session = new SessionManager(this.storage, this.config.sessionTimeout);
    this.identity = new IdentityManager(this.storage);
    this.transport = new Transport(this.config.apiUrl, this.config.apiKey);
  }

  /**
   * Initialize the tracker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Start or resume session
    await this.session.start();

    // Set up auto-tracking
    if (this.config.autoTrack) {
      this.setupAutoTracking();
    }

    // Set up periodic flushing
    this.startFlushTimer();

    // Handle page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }

    this.isInitialized = true;
    this.log('Analytics tracker initialized');
  }

  /**
   * Track a custom event
   */
  track(eventType: string, properties?: Record<string, any>): void {
    const event: TrackingEvent = {
      id: uuidv4(),
      type: eventType,
      properties,
      timestamp: Date.now(),
      sessionId: this.session.getSessionId(),
      userId: this.identity.getUserId() ?? undefined,
      anonymousId: this.identity.getAnonymousId(),
    };

    this.addEvent(event);
    this.emit('track', event);
  }

  /**
   * Track a page view
   */
  pageView(page?: Partial<PageViewEvent>): void {
    const pageData: PageViewEvent = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      ...page,
    };

    this.track('page_view', pageData);
    this.session.incrementPageViews();
  }

  /**
   * Track a conversion event
   */
  conversion(data: ConversionEvent): void {
    this.track('conversion', data);
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, any>): void {
    this.identity.identify(userId, traits);

    this.track('identify', {
      userId,
      traits,
    });
  }

  /**
   * Clear user identity (logout)
   */
  reset(): void {
    this.identity.reset();
    this.session.end();
    this.session.start();

    this.log('User identity reset');
  }

  /**
   * Add callback for events
   */
  onTrack(callback: EventCallback): () => void {
    this.on('track', callback);
    return () => this.off('track', callback);
  }

  /**
   * Flush queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.transport.send(events);
      this.log(`Flushed ${events.length} events`);
    } catch (error) {
      this.log('Failed to flush events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Manually trigger flush and cleanup
   */
  async shutdown(): Promise<void> {
    this.stopFlushTimer();
    await this.flush();
    this.session.end();
    this.isInitialized = false;
  }

  // Private methods

  private addEvent(event: TrackingEvent): void {
    this.eventQueue.push(event);
    this.session.incrementEvents();

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private setupAutoTracking(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Auto-track page views
    this.pageView();

    // Track clicks on links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link) {
        this.track('link_click', {
          href: link.href,
          text: link.textContent?.trim(),
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;

      this.track('form_submit', {
        formId: form.id,
        formName: form.name,
        action: form.action,
      });
    });

    // Track outbound links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.hostname !== window.location.hostname) {
        this.track('outbound_link', {
          href: link.href,
          text: link.textContent?.trim(),
        });
      }
    });

    this.log('Auto-tracking enabled');
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }
}
