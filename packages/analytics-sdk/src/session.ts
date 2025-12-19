import { v4 as uuidv4 } from 'uuid';
import type { SessionData } from './types';
import type { StorageManager } from './storage';

/**
 * Session management for analytics
 */
export class SessionManager {
  private static readonly SESSION_KEY = 'nexus_analytics_session';
  private session: SessionData | null = null;
  private timeout: number;
  private storage: StorageManager;
  private activityTimer?: NodeJS.Timeout;

  constructor(storage: StorageManager, timeout: number = 30 * 60 * 1000) {
    this.storage = storage;
    this.timeout = timeout;
  }

  /**
   * Start or resume a session
   */
  start(): void {
    const existingSession = this.loadSession();

    if (existingSession && !this.isSessionExpired(existingSession)) {
      // Resume existing session
      this.session = existingSession;
      this.updateActivity();
    } else {
      // Create new session
      this.session = this.createNewSession();
      this.saveSession();
    }

    // Set up activity tracking
    this.setupActivityTracking();
  }

  /**
   * End the current session
   */
  end(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    this.session = null;
    this.storage.remove(SessionManager.SESSION_KEY);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | undefined {
    return this.session?.id;
  }

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Update session with UTM parameters
   */
  updateUTM(params: SessionData['utm']): void {
    if (this.session) {
      this.session.utm = { ...this.session.utm, ...params };
      this.saveSession();
    }
  }

  /**
   * Increment page view count
   */
  incrementPageViews(): void {
    if (this.session) {
      this.session.pageViews++;
      this.updateActivity();
      this.saveSession();
    }
  }

  /**
   * Increment event count
   */
  incrementEvents(): void {
    if (this.session) {
      this.session.events++;
      this.updateActivity();
      this.saveSession();
    }
  }

  // Private methods

  private createNewSession(): SessionData {
    const params = new URLSearchParams(window.location.search);

    return {
      id: uuidv4(),
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      pageViews: 0,
      events: 0,
      referrer: document.referrer || undefined,
      utm: {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        term: params.get('utm_term') || undefined,
        content: params.get('utm_content') || undefined,
      },
    };
  }

  private loadSession(): SessionData | null {
    const data = this.storage.get<SessionData>(SessionManager.SESSION_KEY);
    return data || null;
  }

  private saveSession(): void {
    if (this.session) {
      this.storage.set(SessionManager.SESSION_KEY, this.session);
    }
  }

  private isSessionExpired(session: SessionData): boolean {
    const now = Date.now();
    const timeSinceActivity = now - session.lastActivityTime;
    return timeSinceActivity > this.timeout;
  }

  private updateActivity(): void {
    if (this.session) {
      this.session.lastActivityTime = Date.now();
    }
  }

  private setupActivityTracking(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Track user activity
    const trackActivity = () => {
      this.updateActivity();
      this.saveSession();
    };

    // Listen for user interactions
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((event) => {
      window.addEventListener(event, trackActivity, { passive: true });
    });

    // Periodic check for session expiry
    this.activityTimer = setInterval(() => {
      if (this.session && this.isSessionExpired(this.session)) {
        this.end();
        this.start();
      }
    }, 60000); // Check every minute
  }
}
