import type { TrackingEvent, AnalyticsTransport } from './types';

/**
 * HTTP transport for sending analytics events
 */
export class Transport implements AnalyticsTransport {
  private apiUrl: string;
  private apiKey: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Send events to analytics API
   */
  async send(events: TrackingEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        await this.sendRequest(events);
        return; // Success
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('4')) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.retryAttempts - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Failed to send analytics events');
  }

  // Private methods

  private async sendRequest(events: TrackingEvent[]): Promise<void> {
    const response = await fetch(`${this.apiUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        events,
        timestamp: Date.now(),
      }),
      // Use sendBeacon for page unload events if available
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Send events using sendBeacon (for page unload)
   */
  sendBeacon(events: TrackingEvent[]): boolean {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      return false;
    }

    const blob = new Blob(
      [
        JSON.stringify({
          events,
          timestamp: Date.now(),
        }),
      ],
      { type: 'application/json' }
    );

    return navigator.sendBeacon(`${this.apiUrl}/events`, blob);
  }
}
