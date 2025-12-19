import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { CronJob } from 'cron';
import metricsService from './metrics.service';
import config from '../config';

const prisma = new PrismaClient();

export interface ReportInput {
  userId: string;
  brandId?: string;
  name: string;
  description?: string;
  type: 'performance' | 'comparison' | 'trend' | 'custom';
  filters: any;
  schedule?: any;
  format?: 'pdf' | 'excel' | 'csv';
  recipients?: string[];
  template?: string;
}

class ReportingService {
  private scheduledJobs: Map<string, CronJob> = new Map();

  /**
   * Create a new report
   */
  async createReport(input: ReportInput) {
    const report = await prisma.report.create({
      data: {
        userId: input.userId,
        brandId: input.brandId,
        name: input.name,
        description: input.description,
        type: input.type,
        filters: input.filters,
        schedule: input.schedule,
        format: input.format || 'pdf',
        recipients: input.recipients || [],
        template: input.template,
        isActive: true,
      },
    });

    // Schedule if cron expression provided
    if (input.schedule?.cron) {
      this.scheduleReport(report.id, input.schedule.cron);
    }

    return report;
  }

  /**
   * Update report
   */
  async updateReport(id: string, updates: Partial<ReportInput>) {
    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.filters && { filters: updates.filters }),
        ...(updates.schedule !== undefined && { schedule: updates.schedule }),
        ...(updates.format && { format: updates.format }),
        ...(updates.recipients && { recipients: updates.recipients }),
        ...(updates.template !== undefined && { template: updates.template }),
      },
    });

    // Reschedule if schedule changed
    if (updates.schedule) {
      this.unscheduleReport(id);
      if (updates.schedule.cron) {
        this.scheduleReport(id, updates.schedule.cron);
      }
    }

    return report;
  }

  /**
   * Get report by ID
   */
  async getReport(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    return report;
  }

  /**
   * List reports
   */
  async listReports(filters: {
    userId?: string;
    brandId?: string;
    type?: string;
    isActive?: boolean;
  }) {
    const reports = await prisma.report.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.brandId && { brandId: filters.brandId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports;
  }

  /**
   * Delete report
   */
  async deleteReport(id: string) {
    this.unscheduleReport(id);

    await prisma.report.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Generate report
   */
  async generateReport(reportId: string) {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Create execution record
    const execution = await prisma.reportExecution.create({
      data: {
        reportId,
        status: 'processing',
      },
    });

    try {
      // Fetch data based on filters
      const data = await this.fetchReportData(report.filters);

      // Generate file based on format
      let filePath: string;
      let fileSize: number;

      switch (report.format) {
        case 'pdf':
          filePath = await this.generatePDF(report, data);
          break;
        case 'excel':
          filePath = await this.generateExcel(report, data);
          break;
        case 'csv':
          filePath = await this.generateCSV(report, data);
          break;
        default:
          throw new Error(`Unsupported format: ${report.format}`);
      }

      // Get file size
      const stats = fs.statSync(filePath);
      fileSize = stats.size;

      // Update execution
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          fileUrl: filePath,
          fileSize,
          completedAt: new Date(),
        },
      });

      // Update report last run
      await prisma.report.update({
        where: { id: reportId },
        data: { lastRunAt: new Date() },
      });

      // Send to recipients if configured
      if (report.recipients && Array.isArray(report.recipients) && report.recipients.length > 0) {
        await this.sendReport(report.recipients as string[], filePath, report.name);
      }

      return {
        executionId: execution.id,
        filePath,
        fileSize,
      };
    } catch (error) {
      // Update execution with error
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Schedule report generation
   */
  scheduleReport(reportId: string, cronExpression: string) {
    const job = new CronJob(cronExpression, async () => {
      try {
        await this.generateReport(reportId);
      } catch (error) {
        console.error(`Failed to generate scheduled report ${reportId}:`, error);
      }
    });

    job.start();
    this.scheduledJobs.set(reportId, job);
  }

  /**
   * Unschedule report
   */
  unscheduleReport(reportId: string) {
    const job = this.scheduledJobs.get(reportId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(reportId);
    }
  }

  /**
   * Get report history
   */
  async getReportHistory(reportId: string, limit: number = 20) {
    const executions = await prisma.reportExecution.findMany({
      where: { reportId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return executions;
  }

  /**
   * Download report execution
   */
  async downloadReport(executionId: string) {
    const execution = await prisma.reportExecution.findUnique({
      where: { id: executionId },
      include: { report: true },
    });

    if (!execution || !execution.fileUrl) {
      throw new Error('Report file not found');
    }

    if (!fs.existsSync(execution.fileUrl)) {
      throw new Error('Report file no longer exists');
    }

    return {
      filePath: execution.fileUrl,
      fileName: `${execution.report.name}-${execution.id}.${execution.report.format}`,
      mimeType: this.getMimeType(execution.report.format),
    };
  }

  /**
   * Apply whitelabel branding to report
   */
  async whitelabelReport(reportId: string, branding: {
    logo?: string;
    colors?: { primary: string; secondary: string };
    companyName?: string;
    footer?: string;
  }) {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        template: branding,
      },
    });

    return report;
  }

  // Helper methods

  private async fetchReportData(filters: any) {
    const { entityType, entityId, startDate, endDate, metrics } = filters;

    const snapshots = await metricsService.getMetrics({
      entityType,
      entityId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics,
    });

    return snapshots;
  }

  private async generatePDF(report: any, data: any): Promise<string> {
    const fileName = `report-${report.id}-${Date.now()}.pdf`;
    const filePath = path.join(config.storage.reportPath, fileName);

    // Ensure directory exists
    fs.mkdirSync(config.storage.reportPath, { recursive: true });

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Apply branding if template exists
    const branding = report.template || {};

    // Header
    doc.fontSize(24).text(report.name, { align: 'center' });
    if (branding.companyName) {
      doc.fontSize(12).text(branding.companyName, { align: 'center' });
    }
    doc.moveDown();

    // Report metadata
    doc.fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
      .text(`Type: ${report.type}`, { align: 'right' });
    doc.moveDown(2);

    // Data summary
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`Total Records: ${data.length}`);
    doc.moveDown();

    // Data table (simplified)
    if (Array.isArray(data) && data.length > 0) {
      doc.fontSize(14).text('Data', { underline: true });
      doc.moveDown();

      data.slice(0, 20).forEach((item: any, index: number) => {
        doc.fontSize(10).text(`${index + 1}. ${JSON.stringify(item.metrics).slice(0, 100)}...`);
      });
    }

    // Footer
    if (branding.footer) {
      doc.fontSize(8).text(branding.footer, { align: 'center' });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  private async generateExcel(report: any, data: any): Promise<string> {
    const fileName = `report-${report.id}-${Date.now()}.xlsx`;
    const filePath = path.join(config.storage.reportPath, fileName);

    fs.mkdirSync(config.storage.reportPath, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Data');

    // Add header
    worksheet.addRow([report.name]);
    worksheet.addRow(['Generated:', new Date().toLocaleString()]);
    worksheet.addRow(['Type:', report.type]);
    worksheet.addRow([]);

    // Add data
    if (Array.isArray(data) && data.length > 0) {
      const headers = ['ID', 'Entity Type', 'Entity ID', 'Period', 'Recorded At', 'Metrics'];
      worksheet.addRow(headers);

      data.forEach((item: any) => {
        worksheet.addRow([
          item.id,
          item.entityType,
          item.entityId,
          item.period,
          item.recordedAt,
          JSON.stringify(item.metrics),
        ]);
      });

      // Style header row
      const headerRow = worksheet.getRow(5);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private async generateCSV(report: any, data: any): Promise<string> {
    const fileName = `report-${report.id}-${Date.now()}.csv`;
    const filePath = path.join(config.storage.reportPath, fileName);

    fs.mkdirSync(config.storage.reportPath, { recursive: true });

    const fields = ['id', 'entityType', 'entityId', 'period', 'recordedAt', 'metrics'];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(data);

    fs.writeFileSync(filePath, csv);
    return filePath;
  }

  private async sendReport(recipients: string[], filePath: string, reportName: string) {
    // This would integrate with email service
    console.log(`Sending report ${reportName} to ${recipients.join(', ')}`);
    // TODO: Implement actual email sending
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
    };

    return mimeTypes[format] || 'application/octet-stream';
  }
}

export default new ReportingService();
