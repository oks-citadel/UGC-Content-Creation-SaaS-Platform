import type { AttributionData } from './types';

/**
 * Attribution tracking for marketing campaigns
 */
export class AttributionTracker {
  private attribution: AttributionData | null = null;

  constructor() {
    this.detectAttribution();
  }

  /**
   * Get current attribution data
   */
  getAttribution(): AttributionData | null {
    return this.attribution;
  }

  /**
   * Manually set attribution
   */
  setAttribution(data: Partial<AttributionData>): void {
    this.attribution = {
      source: data.source || 'direct',
      medium: data.medium || 'none',
      campaign: data.campaign,
      term: data.term,
      content: data.content,
      referrer: data.referrer || document.referrer,
      landingPage: data.landingPage || window.location.href,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear attribution data
   */
  clearAttribution(): void {
    this.attribution = null;
  }

  // Private methods

  private detectAttribution(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    // Check for UTM parameters
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmTerm = params.get('utm_term');
    const utmContent = params.get('utm_content');

    if (utmSource || utmMedium) {
      this.attribution = {
        source: utmSource || this.detectSourceFromReferrer(),
        medium: utmMedium || 'referral',
        campaign: utmCampaign || undefined,
        term: utmTerm || undefined,
        content: utmContent || undefined,
        referrer: document.referrer,
        landingPage: window.location.href,
        timestamp: Date.now(),
      };
      return;
    }

    // Check for referrer
    if (document.referrer) {
      const source = this.detectSourceFromReferrer();
      const medium = this.detectMediumFromReferrer();

      this.attribution = {
        source,
        medium,
        referrer: document.referrer,
        landingPage: window.location.href,
        timestamp: Date.now(),
      };
      return;
    }

    // Direct traffic
    this.attribution = {
      source: 'direct',
      medium: 'none',
      landingPage: window.location.href,
      timestamp: Date.now(),
    };
  }

  private detectSourceFromReferrer(): string {
    if (!document.referrer) {
      return 'direct';
    }

    try {
      const referrerUrl = new URL(document.referrer);
      const hostname = referrerUrl.hostname;

      // Social media
      if (this.isSocialMedia(hostname)) {
        return this.getSocialMediaName(hostname);
      }

      // Search engines
      if (this.isSearchEngine(hostname)) {
        return this.getSearchEngineName(hostname);
      }

      // Other referrers
      return hostname;
    } catch {
      return 'unknown';
    }
  }

  private detectMediumFromReferrer(): string {
    if (!document.referrer) {
      return 'none';
    }

    try {
      const referrerUrl = new URL(document.referrer);
      const hostname = referrerUrl.hostname;

      if (this.isSearchEngine(hostname)) {
        return 'organic';
      }

      if (this.isSocialMedia(hostname)) {
        return 'social';
      }

      return 'referral';
    } catch {
      return 'referral';
    }
  }

  private isSearchEngine(hostname: string): boolean {
    const searchEngines = [
      'google',
      'bing',
      'yahoo',
      'duckduckgo',
      'baidu',
      'yandex',
      'ask',
    ];

    return searchEngines.some((engine) => hostname.includes(engine));
  }

  private getSearchEngineName(hostname: string): string {
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('bing')) return 'bing';
    if (hostname.includes('yahoo')) return 'yahoo';
    if (hostname.includes('duckduckgo')) return 'duckduckgo';
    if (hostname.includes('baidu')) return 'baidu';
    if (hostname.includes('yandex')) return 'yandex';
    return 'search-engine';
  }

  private isSocialMedia(hostname: string): boolean {
    const socialPlatforms = [
      'facebook',
      'twitter',
      'linkedin',
      'instagram',
      'tiktok',
      'youtube',
      'pinterest',
      'reddit',
      'snapchat',
    ];

    return socialPlatforms.some((platform) => hostname.includes(platform));
  }

  private getSocialMediaName(hostname: string): string {
    if (hostname.includes('facebook')) return 'facebook';
    if (hostname.includes('twitter') || hostname.includes('t.co')) return 'twitter';
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('instagram')) return 'instagram';
    if (hostname.includes('tiktok')) return 'tiktok';
    if (hostname.includes('youtube')) return 'youtube';
    if (hostname.includes('pinterest')) return 'pinterest';
    if (hostname.includes('reddit')) return 'reddit';
    if (hostname.includes('snapchat')) return 'snapchat';
    return 'social';
  }
}
