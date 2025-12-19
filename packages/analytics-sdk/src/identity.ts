import { v4 as uuidv4 } from 'uuid';
import type { UserIdentity } from './types';
import type { StorageManager } from './storage';

/**
 * User identity management
 */
export class IdentityManager {
  private static readonly USER_KEY = 'nexus_analytics_user';
  private static readonly ANONYMOUS_KEY = 'nexus_analytics_anonymous';

  private userId: string | null = null;
  private anonymousId: string;
  private traits: Record<string, any> = {};
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
    this.anonymousId = this.getOrCreateAnonymousId();
    this.loadIdentity();
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    this.traits = { ...this.traits, ...traits };

    const identity: UserIdentity = {
      userId,
      traits: this.traits,
      timestamp: Date.now(),
    };

    this.storage.set(IdentityManager.USER_KEY, identity);
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get anonymous ID
   */
  getAnonymousId(): string {
    return this.anonymousId;
  }

  /**
   * Get user traits
   */
  getTraits(): Record<string, any> {
    return { ...this.traits };
  }

  /**
   * Update user traits
   */
  updateTraits(traits: Record<string, any>): void {
    this.traits = { ...this.traits, ...traits };

    if (this.userId) {
      const identity: UserIdentity = {
        userId: this.userId,
        traits: this.traits,
        timestamp: Date.now(),
      };

      this.storage.set(IdentityManager.USER_KEY, identity);
    }
  }

  /**
   * Reset identity (logout)
   */
  reset(): void {
    this.userId = null;
    this.traits = {};
    this.storage.remove(IdentityManager.USER_KEY);

    // Generate new anonymous ID
    this.anonymousId = uuidv4();
    this.storage.set(IdentityManager.ANONYMOUS_KEY, this.anonymousId);
  }

  // Private methods

  private loadIdentity(): void {
    const identity = this.storage.get<UserIdentity>(IdentityManager.USER_KEY);

    if (identity) {
      this.userId = identity.userId;
      this.traits = identity.traits || {};
    }
  }

  private getOrCreateAnonymousId(): string {
    let anonymousId = this.storage.get<string>(IdentityManager.ANONYMOUS_KEY);

    if (!anonymousId) {
      anonymousId = uuidv4();
      this.storage.set(IdentityManager.ANONYMOUS_KEY, anonymousId);
    }

    return anonymousId;
  }
}
