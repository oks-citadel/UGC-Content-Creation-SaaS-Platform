import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface TaxInfo {
  id: string;
  creatorId: string;
  taxIdType: 'ssn' | 'ein' | 'itin' | 'foreign';
  taxIdLast4: string;
  legalName: string;
  address: Address;
  businessType?: 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 'partnership';
  formType: 'W-9' | 'W-8BEN' | 'W-8BEN-E';
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
}

export interface TaxDocument {
  id: string;
  creatorId: string;
  type: '1099-NEC' | '1099-K' | '1042-S' | 'annual_summary';
  year: number;
  filename: string;
  generatedAt: string;
  downloadedAt?: string;
}

export interface AnnualSummary {
  year: number;
  totalGrossEarnings: number;
  totalPlatformFees: number;
  totalNetEarnings: number;
  totalPayouts: number;
  currency: string;
  contentCount: number;
  campaignCount: number;
  monthlyBreakdown: {
    month: number;
    earnings: number;
    payouts: number;
  }[];
}

export interface TaxInfoParams {
  taxIdType: 'ssn' | 'ein' | 'itin' | 'foreign';
  taxId: string;
  legalName: string;
  address: Address;
  businessType?: 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 'partnership';
}

export class TaxService {
  private taxInfos: Map<string, TaxInfo> = new Map();
  private documents: Map<string, TaxDocument[]> = new Map();

  async getTaxDocuments(creatorId: string, year?: number): Promise<TaxDocument[]> {
    let docs = this.documents.get(creatorId) || [];

    if (year) {
      docs = docs.filter(d => d.year === year);
    }

    return docs.sort((a, b) => b.year - a.year);
  }

  async downloadTaxDocument(documentId: string): Promise<{ filename: string; data: Buffer }> {
    // Find the document
    let found: TaxDocument | undefined;
    for (const docs of this.documents.values()) {
      found = docs.find(d => d.id === documentId);
      if (found) break;
    }

    if (!found) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Update download timestamp
    found.downloadedAt = new Date().toISOString();

    // In production, this would fetch the actual PDF from storage
    const mockPdfContent = Buffer.from(`Mock PDF for ${found.type} - ${found.year}`);

    return {
      filename: found.filename,
      data: mockPdfContent,
    };
  }

  async getTaxInfo(creatorId: string): Promise<TaxInfo | null> {
    return this.taxInfos.get(creatorId) || null;
  }

  async submitTaxInfo(creatorId: string, params: TaxInfoParams): Promise<TaxInfo> {
    // Determine form type based on tax ID type and country
    let formType: TaxInfo['formType'] = 'W-9';
    if (params.taxIdType === 'foreign') {
      formType = params.businessType && params.businessType !== 'individual'
        ? 'W-8BEN-E'
        : 'W-8BEN';
    }

    const taxInfo: TaxInfo = {
      id: uuidv4(),
      creatorId,
      taxIdType: params.taxIdType,
      taxIdLast4: params.taxId.slice(-4),
      legalName: params.legalName,
      address: params.address,
      businessType: params.businessType,
      formType,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    this.taxInfos.set(creatorId, taxInfo);
    logger.info({ taxInfoId: taxInfo.id, creatorId, formType }, 'Tax info submitted');

    return taxInfo;
  }

  async getAnnualSummary(creatorId: string, year: number): Promise<AnnualSummary> {
    // In production, this would aggregate from the earnings and payouts tables
    const summary: AnnualSummary = {
      year,
      totalGrossEarnings: 0,
      totalPlatformFees: 0,
      totalNetEarnings: 0,
      totalPayouts: 0,
      currency: 'USD',
      contentCount: 0,
      campaignCount: 0,
      monthlyBreakdown: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        earnings: 0,
        payouts: 0,
      })),
    };

    return summary;
  }

  async generateTaxDocument(
    creatorId: string,
    type: TaxDocument['type'],
    year: number
  ): Promise<TaxDocument> {
    const doc: TaxDocument = {
      id: uuidv4(),
      creatorId,
      type,
      year,
      filename: `${type}_${year}_${creatorId}.pdf`,
      generatedAt: new Date().toISOString(),
    };

    const creatorDocs = this.documents.get(creatorId) || [];
    creatorDocs.push(doc);
    this.documents.set(creatorId, creatorDocs);

    logger.info({ documentId: doc.id, creatorId, type, year }, 'Tax document generated');

    return doc;
  }

  async verifyTaxInfo(creatorId: string, approved: boolean, reason?: string): Promise<TaxInfo> {
    const taxInfo = this.taxInfos.get(creatorId);

    if (!taxInfo) {
      throw new AppError('Tax info not found', 404, 'TAX_INFO_NOT_FOUND');
    }

    if (approved) {
      taxInfo.status = 'verified';
      taxInfo.verifiedAt = new Date().toISOString();
    } else {
      taxInfo.status = 'rejected';
    }

    this.taxInfos.set(creatorId, taxInfo);
    logger.info({ taxInfoId: taxInfo.id, creatorId, approved, reason }, 'Tax info verification');

    return taxInfo;
  }
}
