import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

export interface UsageRights {
  platforms: ('website' | 'social' | 'paid_ads' | 'email' | 'print' | 'broadcast' | 'all')[];
  territories: string[];
  duration: 'perpetual' | '1_year' | '2_years' | '5_years' | 'custom';
  durationDays?: number;
  exclusivity: 'exclusive' | 'non_exclusive';
  modifications: 'allowed' | 'not_allowed' | 'with_approval';
}

export interface Compensation {
  type: 'flat_fee' | 'royalty' | 'hybrid';
  amount?: number;
  currency: string;
  royaltyPercent?: number;
}

export interface ContentRights {
  id: string;
  contentId: string;
  creatorId: string;
  brandId: string;
  campaignId?: string;
  usageRights: UsageRights;
  compensation: Compensation;
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'revoked';
  signedByCreator: boolean;
  signedByBrand: boolean;
  creatorSignedAt?: string;
  brandSignedAt?: string;
  effectiveDate?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseAgreement {
  id: string;
  rightsId: string;
  documentUrl?: string;
  document?: string | Buffer;
  status: 'draft' | 'pending' | 'signed' | 'countersigned';
  createdAt: string;
}

export interface SignatureData {
  signatureData: string;
  signedAt: string;
  ipAddress?: string;
}

export interface RightsHistoryEntry {
  id: string;
  rightsId: string;
  action: 'created' | 'signed' | 'modified' | 'transferred' | 'revoked' | 'expired';
  actor: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface CreateRightsParams {
  contentId: string;
  creatorId: string;
  brandId: string;
  campaignId?: string;
  usageRights: UsageRights;
  compensation: Compensation;
}

export class RightsService {
  private rights: Map<string, ContentRights> = new Map();
  private licenses: Map<string, LicenseAgreement> = new Map();
  private history: Map<string, RightsHistoryEntry[]> = new Map();

  async createContentRights(params: CreateRightsParams): Promise<ContentRights> {
    // Check for existing active rights
    const existingRights = Array.from(this.rights.values())
      .find(r => r.contentId === params.contentId && r.status === 'active');

    if (existingRights) {
      throw new AppError('Active rights already exist for this content', 400, 'RIGHTS_EXIST');
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Calculate expiration date
    let expirationDate: string | undefined;
    if (params.usageRights.duration !== 'perpetual') {
      const days = this.getDurationDays(params.usageRights.duration, params.usageRights.durationDays);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      expirationDate = expDate.toISOString();
    }

    const rights: ContentRights = {
      id,
      contentId: params.contentId,
      creatorId: params.creatorId,
      brandId: params.brandId,
      campaignId: params.campaignId,
      usageRights: params.usageRights,
      compensation: params.compensation,
      status: 'draft',
      signedByCreator: false,
      signedByBrand: false,
      expirationDate,
      createdAt: now,
      updatedAt: now,
    };

    this.rights.set(id, rights);
    this.addHistoryEntry(id, 'created', 'system', { params });

    logger.info({ rightsId: id, contentId: params.contentId }, 'Content rights created');

    return rights;
  }

  async getContentRights(contentId: string): Promise<ContentRights | null> {
    const rights = Array.from(this.rights.values())
      .find(r => r.contentId === contentId);
    return rights || null;
  }

  async getLicenseAgreement(contentId: string, format: 'json' | 'pdf' | 'html' = 'json'): Promise<LicenseAgreement> {
    const rights = await this.getContentRights(contentId);

    if (!rights) {
      throw new AppError('Rights not found for this content', 404, 'RIGHTS_NOT_FOUND');
    }

    // Check if license already exists
    let license = Array.from(this.licenses.values())
      .find(l => l.rightsId === rights.id);

    if (!license) {
      license = {
        id: uuidv4(),
        rightsId: rights.id,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      this.licenses.set(license.id, license);
    }

    // Generate document based on format
    if (format === 'pdf') {
      license.document = await this.generatePdfLicense(rights);
    } else if (format === 'html') {
      license.document = this.generateHtmlLicense(rights);
    }

    return license;
  }

  async signLicense(contentId: string, creatorId: string, signatureData: SignatureData): Promise<ContentRights> {
    const rights = await this.getContentRights(contentId);

    if (!rights) {
      throw new AppError('Rights not found', 404, 'RIGHTS_NOT_FOUND');
    }

    if (rights.creatorId !== creatorId) {
      throw new AppError('Not authorized to sign this license', 403, 'UNAUTHORIZED');
    }

    if (rights.signedByCreator) {
      throw new AppError('License already signed by creator', 400, 'ALREADY_SIGNED');
    }

    rights.signedByCreator = true;
    rights.creatorSignedAt = signatureData.signedAt;
    rights.updatedAt = new Date().toISOString();

    // If both parties have signed, activate the rights
    if (rights.signedByCreator && rights.signedByBrand) {
      rights.status = 'active';
      rights.effectiveDate = new Date().toISOString();
    } else {
      rights.status = 'pending_signature';
    }

    this.rights.set(rights.id, rights);
    this.addHistoryEntry(rights.id, 'signed', creatorId, { type: 'creator', signatureData });

    // Update license status
    const license = Array.from(this.licenses.values())
      .find(l => l.rightsId === rights.id);
    if (license) {
      license.status = rights.signedByBrand ? 'countersigned' : 'signed';
      this.licenses.set(license.id, license);
    }

    logger.info({ rightsId: rights.id, creatorId }, 'License signed by creator');

    return rights;
  }

  async getRightsHistory(contentId: string): Promise<RightsHistoryEntry[]> {
    const rights = await this.getContentRights(contentId);

    if (!rights) {
      return [];
    }

    return this.history.get(rights.id) || [];
  }

  async transferRights(contentId: string, newBrandId: string, reason: string): Promise<ContentRights> {
    const rights = await this.getContentRights(contentId);

    if (!rights) {
      throw new AppError('Rights not found', 404, 'RIGHTS_NOT_FOUND');
    }

    if (rights.status !== 'active') {
      throw new AppError('Can only transfer active rights', 400, 'INVALID_STATUS');
    }

    const oldBrandId = rights.brandId;
    rights.brandId = newBrandId;
    rights.updatedAt = new Date().toISOString();

    this.rights.set(rights.id, rights);
    this.addHistoryEntry(rights.id, 'transferred', 'system', {
      oldBrandId,
      newBrandId,
      reason
    });

    logger.info({ rightsId: rights.id, oldBrandId, newBrandId }, 'Rights transferred');

    return rights;
  }

  async revokeRights(contentId: string, reason: string): Promise<void> {
    const rights = await this.getContentRights(contentId);

    if (!rights) {
      throw new AppError('Rights not found', 404, 'RIGHTS_NOT_FOUND');
    }

    rights.status = 'revoked';
    rights.updatedAt = new Date().toISOString();

    this.rights.set(rights.id, rights);
    this.addHistoryEntry(rights.id, 'revoked', 'system', { reason });

    logger.info({ rightsId: rights.id, reason }, 'Rights revoked');
  }

  private getDurationDays(duration: string, customDays?: number): number {
    switch (duration) {
      case '1_year': return 365;
      case '2_years': return 730;
      case '5_years': return 1825;
      case 'custom': return customDays || 365;
      default: return 365;
    }
  }

  private addHistoryEntry(
    rightsId: string,
    action: RightsHistoryEntry['action'],
    actor: string,
    details: Record<string, any>
  ): void {
    const entry: RightsHistoryEntry = {
      id: uuidv4(),
      rightsId,
      action,
      actor,
      details,
      timestamp: new Date().toISOString(),
    };

    const entries = this.history.get(rightsId) || [];
    entries.push(entry);
    this.history.set(rightsId, entries);
  }

  private generateHtmlLicense(rights: ContentRights): string {
    const template = `
<!DOCTYPE html>
<html>
<head>
  <title>Content License Agreement</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .section { margin: 20px 0; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <h1>Content License Agreement</h1>

  <div class="section">
    <p><span class="label">License ID:</span> {{id}}</p>
    <p><span class="label">Content ID:</span> {{contentId}}</p>
    <p><span class="label">Status:</span> {{status}}</p>
  </div>

  <h2>Usage Rights</h2>
  <div class="section">
    <p><span class="label">Platforms:</span> {{platforms}}</p>
    <p><span class="label">Territories:</span> {{territories}}</p>
    <p><span class="label">Duration:</span> {{duration}}</p>
    <p><span class="label">Exclusivity:</span> {{exclusivity}}</p>
    <p><span class="label">Modifications:</span> {{modifications}}</p>
  </div>

  <h2>Compensation</h2>
  <div class="section">
    <p><span class="label">Type:</span> {{compensationType}}</p>
    <p><span class="label">Amount:</span> {{amount}} {{currency}}</p>
  </div>

  <div class="section">
    <p><span class="label">Created:</span> {{createdAt}}</p>
  </div>
</body>
</html>`;

    const compiled = Handlebars.compile(template);
    return compiled({
      ...rights,
      platforms: rights.usageRights.platforms.join(', '),
      territories: rights.usageRights.territories.join(', '),
      duration: rights.usageRights.duration,
      exclusivity: rights.usageRights.exclusivity,
      modifications: rights.usageRights.modifications,
      compensationType: rights.compensation.type,
      amount: rights.compensation.amount || 'N/A',
      currency: rights.compensation.currency,
    });
  }

  private async generatePdfLicense(rights: ContentRights): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let y = height - 50;

    // Title
    page.drawText('CONTENT LICENSE AGREEMENT', {
      x: 50,
      y,
      size: 18,
      font: boldFont,
    });

    y -= 40;

    // Content
    const lines = [
      `License ID: ${rights.id}`,
      `Content ID: ${rights.contentId}`,
      `Status: ${rights.status}`,
      '',
      'USAGE RIGHTS',
      `Platforms: ${rights.usageRights.platforms.join(', ')}`,
      `Territories: ${rights.usageRights.territories.join(', ')}`,
      `Duration: ${rights.usageRights.duration}`,
      `Exclusivity: ${rights.usageRights.exclusivity}`,
      '',
      'COMPENSATION',
      `Type: ${rights.compensation.type}`,
      `Amount: ${rights.compensation.amount || 'N/A'} ${rights.compensation.currency}`,
    ];

    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y,
        size: 12,
        font: line.toUpperCase() === line && line.length > 0 ? boldFont : font,
      });
      y -= 20;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
