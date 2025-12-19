/**
 * Storage manager for analytics data
 * Handles localStorage with fallback to in-memory storage
 */
export class StorageManager {
  private inMemoryStorage: Map<string, any> = new Map();
  private useLocalStorage: boolean;

  constructor() {
    this.useLocalStorage = this.isLocalStorageAvailable();
  }

  /**
   * Get value from storage
   */
  get<T>(key: string): T | null {
    try {
      if (this.useLocalStorage) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.inMemoryStorage.get(key) || null;
      }
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  /**
   * Set value in storage
   */
  set(key: string, value: any): void {
    try {
      if (this.useLocalStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        this.inMemoryStorage.set(key, value);
      }
    } catch (error) {
      console.error('Storage set error:', error);
      // Fallback to in-memory if localStorage fails
      this.inMemoryStorage.set(key, value);
    }
  }

  /**
   * Remove value from storage
   */
  remove(key: string): void {
    try {
      if (this.useLocalStorage) {
        localStorage.removeItem(key);
      } else {
        this.inMemoryStorage.delete(key);
      }
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      if (this.useLocalStorage) {
        // Only clear analytics-related keys
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith('nexus_analytics_')) {
            localStorage.removeItem(key);
          }
        });
      } else {
        this.inMemoryStorage.clear();
      }
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    try {
      if (this.useLocalStorage) {
        return localStorage.getItem(key) !== null;
      } else {
        return this.inMemoryStorage.has(key);
      }
    } catch (error) {
      return false;
    }
  }

  // Private methods

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__nexus_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
