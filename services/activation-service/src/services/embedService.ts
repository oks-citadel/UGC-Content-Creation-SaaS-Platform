import { config } from '../config';
import { GeneratedEmbedCode } from '../types/activation';

export class EmbedService {
  private readonly cdnUrl: string;
  private readonly embedUrl: string;

  constructor() {
    this.cdnUrl = config.cdnUrl || 'https://cdn.nexus-ugc.com';
    this.embedUrl = config.embedUrl || 'https://embed.nexus-ugc.com';
  }

  generateEmbedCode(activationId: string): GeneratedEmbedCode {
    const scriptTag = this.generateScriptTag(activationId);
    const iframeTag = this.generateIframeTag(activationId);
    const directUrl = `${this.embedUrl}/v/${activationId}`;

    return {
      activationId,
      script: scriptTag,
      iframe: iframeTag,
      directUrl,
    };
  }

  private generateScriptTag(activationId: string): string {
    return `<div id="nexus-ugc-${activationId}"></div>
<script src="${this.cdnUrl}/embed.js" data-activation-id="${activationId}" async></script>`;
  }

  private generateIframeTag(activationId: string): string {
    return `<iframe 
  src="${this.embedUrl}/v/${activationId}" 
  width="100%" 
  height="400" 
  frameborder="0" 
  allow="autoplay; fullscreen" 
  allowfullscreen>
</iframe>`;
  }

  validateDomain(activationId: string, domain: string): boolean {
    // Domain validation logic would check against activation's targeting config
    return true;
  }
}

export const embedService = new EmbedService();
