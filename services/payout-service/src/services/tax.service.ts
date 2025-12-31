import { PrismaClient, TaxDocumentType, TaxDocumentStatus } from '.prisma/payout-client';
import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

const prisma = new PrismaClient();

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
  async getTaxDocuments(creatorId: string, year?: number): Promise<TaxDocument[]> {
    const whereClause: any = { creatorId };
    if (year) {
      whereClause.taxYear = year;
    }

    const documents = await prisma.taxDocument.findMany({
      where: whereClause,
      orderBy: { taxYear: 'desc' },
    });

    return documents.map(doc => ({
      id: doc.id,
      creatorId: doc.creatorId,
      type: this.mapTaxDocumentType(doc.type),
      year: doc.taxYear,
      filename: `${doc.type}_${doc.taxYear}_${doc.creatorId}.pdf`,
      generatedAt: doc.createdAt.toISOString(),
      downloadedAt: undefined,
    }));
  }

  private mapTaxDocumentType(type: TaxDocumentType): '1099-NEC' | '1099-K' | '1042-S' | 'annual_summary' {
    switch (type) {
      case 'FORM_1099':
        return '1099-NEC';
      case 'FORM_1042S':
        return '1042-S';
      default:
        return 'annual_summary';
    }
  }

  async downloadTaxDocument(documentId: string): Promise<{ filename: string; data: Buffer }> {
    const document = await prisma.taxDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Get creator info and earnings for this tax year
    const [balance, earnings, form1099] = await Promise.all([
      prisma.creatorBalance.findUnique({
        where: { creatorId: document.creatorId },
      }),
      prisma.earning.findMany({
        where: {
          creatorId: document.creatorId,
          earnedAt: {
            gte: new Date(`${document.taxYear}-01-01`),
            lt: new Date(`${document.taxYear + 1}-01-01`),
          },
        },
      }),
      prisma.form1099.findFirst({
        where: {
          creatorId: document.creatorId,
          taxYear: document.taxYear,
        },
      }),
    ]);

    // Generate PDF
    const pdfBuffer = await this.generateTaxPdf(document, {
      legalName: document.legalName || 'Unknown',
      tinLastFour: document.tinLastFour || '****',
      totalEarnings: form1099 ? Number(form1099.totalEarnings) / 100 : earnings.reduce((sum, e) => sum + Number(e.netAmount), 0) / 100,
      taxYear: document.taxYear,
      address: document.address as unknown as Address | null,
    });

    const filename = `${document.type}_${document.taxYear}_${document.creatorId}.pdf`;

    logger.info({ documentId, creatorId: document.creatorId }, 'Tax document downloaded');

    return {
      filename,
      data: pdfBuffer,
    };
  }

  private async generateTaxPdf(
    document: any,
    data: {
      legalName: string;
      tinLastFour: string;
      totalEarnings: number;
      taxYear: number;
      address: Address | null;
    }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text('NEXUS Platform', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Tax Document', { align: 'center' });
      doc.moveDown();

      // Document type header
      const docTypeLabel = this.getDocumentTypeLabel(document.type);
      doc.fontSize(16).font('Helvetica-Bold').text(docTypeLabel, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Tax Year: ${data.taxYear}`, { align: 'center' });
      doc.moveDown(2);

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Payer Information - MUST be configured in environment variables
      const companyName = process.env.COMPANY_LEGAL_NAME;
      const companyAddress1 = process.env.COMPANY_ADDRESS_LINE1;
      const companyAddress2 = process.env.COMPANY_ADDRESS_LINE2;
      const companyEin = process.env.COMPANY_EIN;

      if (!companyName || !companyAddress1 || !companyEin) {
        throw new Error(
          'Tax document generation requires company information. ' +
          'Set COMPANY_LEGAL_NAME, COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2, and COMPANY_EIN environment variables.'
        );
      }

      doc.fontSize(12).font('Helvetica-Bold').text("PAYER'S Information:");
      doc.fontSize(10).font('Helvetica');
      doc.text(companyName);
      doc.text(companyAddress1);
      if (companyAddress2) {
        doc.text(companyAddress2);
      }
      doc.text(`EIN: ${companyEin}`);
      doc.moveDown();

      // Recipient Information
      doc.fontSize(12).font('Helvetica-Bold').text("RECIPIENT'S Information:");
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${data.legalName}`);
      doc.text(`TIN: ***-**-${data.tinLastFour}`);

      if (data.address) {
        doc.text(`Address: ${data.address.line1}`);
        if (data.address.line2) {
          doc.text(`         ${data.address.line2}`);
        }
        doc.text(`         ${data.address.city}, ${data.address.state || ''} ${data.address.postalCode}`);
        doc.text(`         ${data.address.country}`);
      }
      doc.moveDown(2);

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Income Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Income Summary');
      doc.moveDown();

      // Box for income
      const boxY = doc.y;
      doc.rect(50, boxY, 250, 80).stroke();

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Box 1 - Nonemployee Compensation', 60, boxY + 10);
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text(`$${data.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 60, boxY + 35);

      doc.moveDown(6);

      // Important Notice
      doc.fontSize(10).font('Helvetica-Bold').text('IMPORTANT TAX INFORMATION');
      doc.fontSize(9).font('Helvetica');
      doc.text(
        'This is important tax information and is being furnished to the IRS. If you are required to file a return, ' +
        'a negligence penalty or other sanction may be imposed on you if this income is taxable and the IRS determines ' +
        'that it has not been reported.',
        { width: 500 }
      );
      doc.moveDown();

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text(`Document ID: ${document.id}`, 50, 700);
      doc.text(`Generated: ${new Date().toISOString()}`, 50, 712);
      doc.text('This document is for tax purposes only.', 50, 724);

      doc.end();
    });
  }

  private getDocumentTypeLabel(type: TaxDocumentType): string {
    switch (type) {
      case 'FORM_1099':
        return 'Form 1099-NEC';
      case 'FORM_1042S':
        return 'Form 1042-S';
      case 'W9':
        return 'Form W-9';
      case 'W8BEN':
        return 'Form W-8BEN';
      case 'W8BEN_E':
        return 'Form W-8BEN-E';
      default:
        return 'Tax Document';
    }
  }

  async getTaxInfo(creatorId: string): Promise<TaxInfo | null> {
    const document = await prisma.taxDocument.findFirst({
      where: {
        creatorId,
        type: { in: ['W9', 'W8BEN', 'W8BEN_E'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!document) {
      return null;
    }

    return {
      id: document.id,
      creatorId: document.creatorId,
      taxIdType: this.mapTinType(document.tinType),
      taxIdLast4: document.tinLastFour || '****',
      legalName: document.legalName || '',
      address: (document.address as unknown as Address) || {
        line1: '',
        city: '',
        postalCode: '',
        country: '',
      },
      businessType: undefined,
      formType: this.mapFormType(document.type),
      status: this.mapTaxStatus(document.status),
      submittedAt: document.submittedAt?.toISOString() || document.createdAt.toISOString(),
      verifiedAt: document.reviewedAt?.toISOString(),
    };
  }

  private mapTinType(tinType: string | null): 'ssn' | 'ein' | 'itin' | 'foreign' {
    switch (tinType?.toLowerCase()) {
      case 'ssn':
        return 'ssn';
      case 'ein':
        return 'ein';
      case 'itin':
        return 'itin';
      default:
        return 'foreign';
    }
  }

  private mapFormType(type: TaxDocumentType): 'W-9' | 'W-8BEN' | 'W-8BEN-E' {
    switch (type) {
      case 'W8BEN':
        return 'W-8BEN';
      case 'W8BEN_E':
        return 'W-8BEN-E';
      default:
        return 'W-9';
    }
  }

  private mapTaxStatus(status: TaxDocumentStatus): 'pending' | 'verified' | 'rejected' {
    switch (status) {
      case 'VERIFIED':
        return 'verified';
      case 'REJECTED':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  async submitTaxInfo(creatorId: string, params: TaxInfoParams): Promise<TaxInfo> {
    let formType: TaxDocumentType = 'W9';
    if (params.taxIdType === 'foreign') {
      formType = params.businessType && params.businessType !== 'individual'
        ? 'W8BEN_E'
        : 'W8BEN';
    }

    const document = await prisma.taxDocument.create({
      data: {
        creatorId,
        type: formType,
        status: 'PENDING_REVIEW',
        taxYear: new Date().getFullYear(),
        tinType: params.taxIdType,
        tinLastFour: params.taxId.slice(-4),
        legalName: params.legalName,
        address: params.address as any,
        submittedAt: new Date(),
      },
    });

    logger.info({ taxInfoId: document.id, creatorId, formType }, 'Tax info submitted');

    return {
      id: document.id,
      creatorId,
      taxIdType: params.taxIdType,
      taxIdLast4: params.taxId.slice(-4),
      legalName: params.legalName,
      address: params.address,
      businessType: params.businessType,
      formType: this.mapFormType(formType),
      status: 'pending',
      submittedAt: document.submittedAt!.toISOString(),
    };
  }

  async getAnnualSummary(creatorId: string, year: number): Promise<AnnualSummary> {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);

    // Get earnings for the year
    const earnings = await prisma.earning.findMany({
      where: {
        creatorId,
        earnedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Get payouts for the year
    const payouts = await prisma.payout.findMany({
      where: {
        creatorId,
        completedAt: {
          gte: startDate,
          lt: endDate,
        },
        status: 'COMPLETED',
      },
    });

    // Calculate totals
    const totalGrossEarnings = earnings.reduce((sum, e) => sum + Number(e.grossAmount), 0);
    const totalPlatformFees = earnings.reduce((sum, e) => sum + Number(e.platformFee), 0);
    const totalNetEarnings = earnings.reduce((sum, e) => sum + Number(e.netAmount), 0);
    const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.netAmount), 0);

    // Get unique campaign and content counts
    const campaignIds = new Set(earnings.filter(e => e.campaignId).map(e => e.campaignId));
    const contentIds = new Set(earnings.filter(e => e.contentId).map(e => e.contentId));

    // Calculate monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStart = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 1);

      const monthEarnings = earnings
        .filter(e => e.earnedAt >= monthStart && e.earnedAt < monthEnd)
        .reduce((sum, e) => sum + Number(e.netAmount), 0);

      const monthPayouts = payouts
        .filter(p => p.completedAt && p.completedAt >= monthStart && p.completedAt < monthEnd)
        .reduce((sum, p) => sum + Number(p.netAmount), 0);

      return {
        month,
        earnings: monthEarnings / 100, // Convert cents to dollars
        payouts: monthPayouts / 100,
      };
    });

    return {
      year,
      totalGrossEarnings: totalGrossEarnings / 100,
      totalPlatformFees: totalPlatformFees / 100,
      totalNetEarnings: totalNetEarnings / 100,
      totalPayouts: totalPayouts / 100,
      currency: 'USD',
      contentCount: contentIds.size,
      campaignCount: campaignIds.size,
      monthlyBreakdown,
    };
  }

  async generateTaxDocument(
    creatorId: string,
    type: TaxDocument['type'],
    year: number
  ): Promise<TaxDocument> {
    const dbType = this.mapToDbDocumentType(type);

    // Check if document already exists
    const existing = await prisma.taxDocument.findFirst({
      where: {
        creatorId,
        type: dbType,
        taxYear: year,
      },
    });

    if (existing) {
      return {
        id: existing.id,
        creatorId: existing.creatorId,
        type,
        year: existing.taxYear,
        filename: `${type}_${year}_${creatorId}.pdf`,
        generatedAt: existing.createdAt.toISOString(),
      };
    }

    // Get tax info
    const taxInfo = await this.getTaxInfo(creatorId);

    // Create new document
    const document = await prisma.taxDocument.create({
      data: {
        creatorId,
        type: dbType,
        status: 'SUBMITTED',
        taxYear: year,
        legalName: taxInfo?.legalName,
        tinLastFour: taxInfo?.taxIdLast4,
        tinType: taxInfo?.taxIdType,
        address: taxInfo?.address as any,
      },
    });

    // If this is a 1099, also create Form1099 record
    if (type === '1099-NEC' || type === '1099-K') {
      const summary = await this.getAnnualSummary(creatorId, year);

      await prisma.form1099.create({
        data: {
          creatorId,
          taxYear: year,
          totalEarnings: BigInt(Math.round(summary.totalNetEarnings * 100)),
          totalWithholding: BigInt(0),
          recipientName: taxInfo?.legalName || 'Unknown',
          recipientTinLastFour: taxInfo?.taxIdLast4 || '****',
          formType: type,
          boxAmounts: {
            box1: summary.totalNetEarnings,
          },
        },
      });
    }

    logger.info({ documentId: document.id, creatorId, type, year }, 'Tax document generated');

    return {
      id: document.id,
      creatorId,
      type,
      year,
      filename: `${type}_${year}_${creatorId}.pdf`,
      generatedAt: document.createdAt.toISOString(),
    };
  }

  private mapToDbDocumentType(type: '1099-NEC' | '1099-K' | '1042-S' | 'annual_summary'): TaxDocumentType {
    switch (type) {
      case '1099-NEC':
      case '1099-K':
        return 'FORM_1099';
      case '1042-S':
        return 'FORM_1042S';
      default:
        return 'W9';
    }
  }

  async verifyTaxInfo(creatorId: string, approved: boolean, reason?: string): Promise<TaxInfo> {
    const taxDocument = await prisma.taxDocument.findFirst({
      where: {
        creatorId,
        type: { in: ['W9', 'W8BEN', 'W8BEN_E'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!taxDocument) {
      throw new AppError('Tax info not found', 404, 'TAX_INFO_NOT_FOUND');
    }

    const updatedDocument = await prisma.taxDocument.update({
      where: { id: taxDocument.id },
      data: {
        status: approved ? 'VERIFIED' : 'REJECTED',
        reviewedAt: new Date(),
        rejectionReason: approved ? null : reason,
      },
    });

    // Update creator balance tax verified status
    await prisma.creatorBalance.updateMany({
      where: { creatorId },
      data: { taxVerified: approved },
    });

    logger.info({ taxInfoId: taxDocument.id, creatorId, approved, reason }, 'Tax info verification');

    const taxInfo = await this.getTaxInfo(creatorId);
    if (!taxInfo) {
      throw new AppError('Tax info not found after update', 500, 'INTERNAL_ERROR');
    }

    return taxInfo;
  }

  async generateAnnualSummaryPdf(creatorId: string, year: number): Promise<Buffer> {
    const summary = await this.getAnnualSummary(creatorId, year);
    const taxInfo = await this.getTaxInfo(creatorId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('NEXUS Platform', { align: 'center' });
      doc.fontSize(16).text('Annual Earnings Summary', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text(`Tax Year ${year}`, { align: 'center' });
      doc.moveDown(2);

      // Creator Info
      doc.fontSize(12).font('Helvetica-Bold').text('Creator Information:');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${taxInfo?.legalName || 'Not Provided'}`);
      doc.text(`Creator ID: ${creatorId}`);
      doc.moveDown(2);

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Earnings Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Earnings Summary');
      doc.moveDown();

      const summaryTable = [
        ['Total Gross Earnings:', `$${summary.totalGrossEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Platform Fees:', `$${summary.totalPlatformFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Total Net Earnings:', `$${summary.totalNetEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Total Payouts:', `$${summary.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ];

      summaryTable.forEach(([label, value]) => {
        doc.fontSize(10).font('Helvetica-Bold').text(label, 50, doc.y, { continued: true, width: 200 });
        doc.font('Helvetica').text(value, { align: 'right', width: 450 });
      });

      doc.moveDown(2);

      // Activity Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Activity Summary');
      doc.moveDown();
      doc.fontSize(10).font('Helvetica');
      doc.text(`Content Items: ${summary.contentCount}`);
      doc.text(`Campaigns: ${summary.campaignCount}`);
      doc.moveDown(2);

      // Monthly Breakdown
      doc.fontSize(14).font('Helvetica-Bold').text('Monthly Breakdown');
      doc.moveDown();

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Month', 50, doc.y, { continued: true, width: 80 });
      doc.text('Earnings', { continued: true, width: 100, align: 'right' });
      doc.text('Payouts', { width: 100, align: 'right' });

      doc.font('Helvetica');
      summary.monthlyBreakdown.forEach((row) => {
        doc.text(months[row.month - 1], 50, doc.y, { continued: true, width: 80 });
        doc.text(`$${row.earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, { continued: true, width: 100, align: 'right' });
        doc.text(`$${row.payouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, { width: 100, align: 'right' });
      });

      doc.moveDown(2);

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text(`Generated: ${new Date().toISOString()}`, 50, 720);
      doc.text('This document is for informational purposes only and does not constitute tax advice.', 50, 732);

      doc.end();
    });
  }
}

export default new TaxService();
