import { prisma } from '../lib/prisma';
import { DataRequestType, RequestStatus } from '@prisma/client';
import { config } from '../config';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import PDFDocument from 'pdfkit';

const logger = pino({ name: 'gdpr-service' });

// Use config for service URLs
const SERVICE_URLS = config.services;

// Internal service authentication token
const INTERNAL_SERVICE_TOKEN = config.internalServiceToken;

/**
 * Interface for the comprehensive GDPR data export
 */
interface GDPRExportData {
  metadata: ExportMetadata;
  personalInformation: PersonalInformation;
  accountSettings: AccountSettings;
  contentData: ContentData;
  transactionHistory: TransactionHistory;
  activityLogs: ActivityLogs;
  consentRecords: ConsentRecords;
  communicationPreferences: CommunicationPreferences;
}

interface ExportMetadata {
  exportId: string;
  userId: string;
  exportDate: string;
  exportFormat: string;
  dataCategories: string[];
  gdprArticle: string;
  dataController: string;
  contactEmail: string;
}

interface PersonalInformation {
  basicInfo: {
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    phoneNumber: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  profile: {
    company: string | null;
    jobTitle: string | null;
    industry: string | null;
    website: string | null;
    linkedinUrl: string | null;
    twitterHandle: string | null;
    location: string | null;
    country: string | null;
  } | null;
  accountStatus: string;
  role: string;
  timezone: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

interface AccountSettings {
  preferences: {
    theme: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
    compactMode: boolean;
    sidebarCollapsed: boolean;
  } | null;
  security: {
    emailVerified: boolean;
    phoneVerified: boolean;
    mfaEnabled: boolean;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
    activeSessions: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    role: string;
    joinedAt: string;
  }>;
}

interface ContentData {
  media: Array<{
    id: string;
    type: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    url: string;
    status: string;
    createdAt: string;
  }>;
  content: Array<{
    id: string;
    title: string | null;
    description: string | null;
    type: string;
    status: string;
    platform: string | null;
    publishedAt: string | null;
    createdAt: string;
  }>;
  aiGenerations: Array<{
    id: string;
    type: string;
    prompt: string;
    model: string;
    status: string;
    resultUrl: string | null;
    createdAt: string;
  }>;
  templates: Array<{
    id: string;
    name: string;
    type: string;
    category: string | null;
    isPublic: boolean;
    createdAt: string;
  }>;
}

interface TransactionHistory {
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAt: string | null;
    trialStart: string | null;
    trialEnd: string | null;
  } | null;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: string;
    tax: string;
    total: string;
    currency: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    paidAt: string | null;
  }>;
  paymentMethods: Array<{
    id: string;
    type: string;
    brand: string | null;
    last4: string;
    expiryMonth: number | null;
    expiryYear: number | null;
    isDefault: boolean;
  }>;
  usageRecords: Array<{
    type: string;
    quantity: string;
    unit: string;
    recordedAt: string;
  }>;
}

interface ActivityLogs {
  authLogs: Array<{
    action: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
  }>;
  sessions: Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    lastActiveAt: string;
    expiresAt: string;
  }>;
  complianceAuditLogs: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    ipAddress: string | null;
    createdAt: string;
  }>;
  campaignParticipations: Array<{
    campaignId: string;
    campaignName: string;
    status: string;
    appliedAt: string;
    reviewedAt: string | null;
  }>;
  contentSubmissions: Array<{
    contentId: string;
    contentTitle: string | null;
    campaignId: string;
    status: string;
    submittedAt: string;
  }>;
}

interface ConsentRecords {
  consents: Array<{
    id: string;
    type: string;
    purpose: string;
    version: string;
    granted: boolean;
    grantedAt: string | null;
    revokedAt: string | null;
    ipAddress: string | null;
  }>;
  contentRights: Array<{
    id: string;
    contentId: string;
    licenseType: string;
    usageRights: string[];
    territory: string[];
    duration: string | null;
    exclusivity: boolean;
    signedAt: string | null;
    startsAt: string | null;
    endsAt: string | null;
  }>;
  disclosures: Array<{
    id: string;
    contentId: string;
    type: string;
    platform: string;
    text: string;
    isCompliant: boolean;
    createdAt: string;
  }>;
}

interface CommunicationPreferences {
  notifications: {
    emailMarketing: boolean;
    emailProductUpdates: boolean;
    emailCampaignUpdates: boolean;
    emailCreatorMessages: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  } | null;
  marketingConsent: boolean;
  thirdPartyConsent: boolean;
}

/**
 * HTTP client helper for internal service calls
 */
async function fetchFromService<T>(
  serviceUrl: string,
  endpoint: string,
  userId: string
): Promise<T | null> {
  try {
    const response = await fetch(`${serviceUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-Internal-Service': 'compliance-service',
        'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      logger.warn({ serviceUrl, endpoint, status: response.status }, 'Service returned non-OK response');
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    logger.error({ error, serviceUrl, endpoint }, 'Failed to fetch from service');
    return null;
  }
}

export class GDPRService {
  async requestDataExport(userId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.gdpr.dataExportExpiryDays);

    const request = await prisma.dataRequest.create({
      data: {
        userId,
        type: DataRequestType.EXPORT,
        status: RequestStatus.PENDING,
        expiresAt,
      },
    });

    // Process export asynchronously
    this.processDataExport(request.id, userId).catch(error => {
      logger.error({ error, requestId: request.id }, 'Failed to process data export');
    });

    logger.info({ userId, requestId: request.id }, 'Data export requested');
    return request.id;
  }

  private async processDataExport(requestId: string, userId: string): Promise<void> {
    try {
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.PROCESSING, processedAt: new Date() },
      });

      // Collect comprehensive user data from all services
      const exportData = await this.collectAllUserData(requestId, userId);

      // Create archive with structured data
      const archivePath = await this.createExportArchive(requestId, userId, exportData);

      const downloadUrl = `/exports/${userId}-${requestId}.zip`;
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.COMPLETED,
          completedAt: new Date(),
          downloadUrl,
          metadata: {
            totalCategories: exportData.metadata.dataCategories.length,
            exportSize: fs.statSync(archivePath).size,
          },
        },
      });

      logger.info({ requestId, userId, archivePath }, 'Data export completed');
    } catch (error: any) {
      logger.error({ error, requestId }, 'Failed to export data');
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.FAILED,
          completedAt: new Date(),
          notes: error.message,
        },
      });
    }
  }

  /**
   * Collects all user data from platform services for GDPR export
   */
  private async collectAllUserData(requestId: string, userId: string): Promise<GDPRExportData> {
    logger.info({ userId, requestId }, 'Starting comprehensive data collection');

    // Fetch data from all services in parallel for efficiency
    const [
      userData,
      authData,
      contentData,
      campaignData,
      billingData,
      analyticsData,
      complianceData,
    ] = await Promise.all([
      this.fetchUserServiceData(userId),
      this.fetchAuthServiceData(userId),
      this.fetchContentServiceData(userId),
      this.fetchCampaignServiceData(userId),
      this.fetchBillingServiceData(userId),
      this.fetchAnalyticsServiceData(userId),
      this.fetchComplianceData(userId),
    ]);

    // Build comprehensive export data structure
    const exportData: GDPRExportData = {
      metadata: {
        exportId: requestId,
        userId,
        exportDate: new Date().toISOString(),
        exportFormat: 'JSON with PDF summary',
        dataCategories: [
          'Personal Information',
          'Account Settings',
          'Content & Media',
          'Transaction History',
          'Activity Logs',
          'Consent Records',
          'Communication Preferences',
        ],
        gdprArticle: 'Article 20 - Right to Data Portability',
        dataController: config.dataController.name,
        contactEmail: config.dataController.dpoEmail,
      },
      personalInformation: this.buildPersonalInformation(userData, authData),
      accountSettings: this.buildAccountSettings(userData, authData),
      contentData: this.buildContentData(contentData),
      transactionHistory: this.buildTransactionHistory(billingData),
      activityLogs: this.buildActivityLogs(authData, campaignData, analyticsData),
      consentRecords: complianceData,
      communicationPreferences: this.buildCommunicationPreferences(userData, complianceData),
    };

    logger.info({ userId, requestId, categories: exportData.metadata.dataCategories.length }, 'Data collection completed');
    return exportData;
  }

  /**
   * Fetches user profile and preferences from user-service
   */
  private async fetchUserServiceData(userId: string): Promise<any> {
    const [user, profile, preferences, notifications, organizations] = await Promise.all([
      fetchFromService(SERVICE_URLS.userService, `/users/me`, userId),
      fetchFromService(SERVICE_URLS.userService, `/users/me/profile`, userId),
      fetchFromService(SERVICE_URLS.userService, `/users/me/preferences`, userId),
      fetchFromService(SERVICE_URLS.userService, `/users/me/notifications`, userId),
      fetchFromService(SERVICE_URLS.userService, `/users/me/organizations`, userId),
    ]);

    return { user, profile, preferences, notifications, organizations };
  }

  /**
   * Fetches authentication data, sessions, and login history from auth-service
   */
  private async fetchAuthServiceData(userId: string): Promise<any> {
    const sessions = await fetchFromService(SERVICE_URLS.authService, `/auth/sessions`, userId);

    // Also get user auth record directly if available
    const authUser = await fetchFromService(SERVICE_URLS.authService, `/auth/user`, userId);

    return { sessions, authUser };
  }

  /**
   * Fetches user-generated content from content-service
   */
  private async fetchContentServiceData(userId: string): Promise<any> {
    const [media, content, aiGenerations, templates] = await Promise.all([
      fetchFromService(SERVICE_URLS.contentService, `/media?limit=1000`, userId),
      fetchFromService<any[]>(SERVICE_URLS.contentService, `/content?creatorId=${userId}&limit=1000`, userId),
      fetchFromService(SERVICE_URLS.contentService, `/ai-generations?limit=1000`, userId),
      fetchFromService(SERVICE_URLS.contentService, `/templates?createdBy=${userId}&limit=1000`, userId),
    ]);

    return { media, content, aiGenerations, templates };
  }

  /**
   * Fetches campaign participation data from campaign-service
   */
  private async fetchCampaignServiceData(userId: string): Promise<any> {
    const [applications, contentSubmissions] = await Promise.all([
      fetchFromService(SERVICE_URLS.campaignService, `/applications?creatorId=${userId}&limit=1000`, userId),
      fetchFromService(SERVICE_URLS.campaignService, `/content?creatorId=${userId}&limit=1000`, userId),
    ]);

    return { applications, contentSubmissions };
  }

  /**
   * Fetches billing and transaction data from billing-service
   */
  private async fetchBillingServiceData(userId: string): Promise<any> {
    const [subscription, invoices, paymentMethods, usage] = await Promise.all([
      fetchFromService(SERVICE_URLS.billingService, `/subscription`, userId),
      fetchFromService(SERVICE_URLS.billingService, `/invoices?limit=1000`, userId),
      fetchFromService(SERVICE_URLS.billingService, `/payment-methods`, userId),
      fetchFromService(SERVICE_URLS.billingService, `/usage`, userId),
    ]);

    return { subscription, invoices, paymentMethods, usage };
  }

  /**
   * Fetches analytics and activity data from analytics-service
   */
  private async fetchAnalyticsServiceData(userId: string): Promise<any> {
    const [dashboards, reports, alerts] = await Promise.all([
      fetchFromService(SERVICE_URLS.analyticsService, `/dashboards?userId=${userId}`, userId),
      fetchFromService(SERVICE_URLS.analyticsService, `/reports?userId=${userId}`, userId),
      fetchFromService(SERVICE_URLS.analyticsService, `/alerts?userId=${userId}`, userId),
    ]);

    return { dashboards, reports, alerts };
  }

  /**
   * Fetches compliance data from local compliance database
   */
  private async fetchComplianceData(userId: string): Promise<ConsentRecords> {
    const [consents, contentRights, disclosures, auditLogs] = await Promise.all([
      prisma.consent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contentRights.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.disclosure.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
    ]);

    return {
      consents: consents.map(c => ({
        id: c.id,
        type: c.type,
        purpose: c.purpose,
        version: c.version,
        granted: c.granted,
        grantedAt: c.grantedAt?.toISOString() || null,
        revokedAt: c.revokedAt?.toISOString() || null,
        ipAddress: c.ipAddress,
      })),
      contentRights: contentRights.map(cr => ({
        id: cr.id,
        contentId: cr.contentId,
        licenseType: cr.licenseType,
        usageRights: cr.usageRights,
        territory: cr.territory,
        duration: cr.duration,
        exclusivity: cr.exclusivity,
        signedAt: cr.signedAt?.toISOString() || null,
        startsAt: cr.startsAt?.toISOString() || null,
        endsAt: cr.endsAt?.toISOString() || null,
      })),
      disclosures: disclosures.map(d => ({
        id: d.id,
        contentId: d.contentId,
        type: d.type,
        platform: d.platform,
        text: d.text,
        isCompliant: d.isCompliant,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Builds personal information section from collected data
   */
  private buildPersonalInformation(userData: any, authData: any): PersonalInformation {
    const user = userData?.user || {};
    const authUser = authData?.authUser || {};
    const profile = userData?.profile || null;

    return {
      basicInfo: {
        userId: user.id || authUser.id || '',
        email: user.email || authUser.email || '',
        firstName: user.firstName || authUser.firstName || null,
        lastName: user.lastName || authUser.lastName || null,
        displayName: user.displayName || null,
        phoneNumber: user.phoneNumber || authUser.phoneNumber || null,
        avatarUrl: user.avatarUrl || authUser.avatarUrl || null,
        bio: user.bio || null,
      },
      profile: profile ? {
        company: profile.company || null,
        jobTitle: profile.jobTitle || null,
        industry: profile.industry || null,
        website: profile.website || null,
        linkedinUrl: profile.linkedinUrl || null,
        twitterHandle: profile.twitterHandle || null,
        location: profile.location || null,
        country: profile.country || null,
      } : null,
      accountStatus: user.status || authUser.status || 'UNKNOWN',
      role: user.role || authUser.role || 'USER',
      timezone: user.timezone || 'UTC',
      locale: user.locale || 'en',
      createdAt: user.createdAt || authUser.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || authUser.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Builds account settings section from collected data
   */
  private buildAccountSettings(userData: any, authData: any): AccountSettings {
    const preferences = userData?.preferences || null;
    const notifications = userData?.notifications || null;
    const organizations = userData?.organizations || [];
    const authUser = authData?.authUser || {};
    const sessions = authData?.sessions || [];

    return {
      preferences: preferences ? {
        theme: preferences.theme || 'system',
        language: preferences.language || 'en',
        dateFormat: preferences.dateFormat || 'MM/DD/YYYY',
        timeFormat: preferences.timeFormat || '12h',
        weekStartsOn: preferences.weekStartsOn ?? 0,
        compactMode: preferences.compactMode ?? false,
        sidebarCollapsed: preferences.sidebarCollapsed ?? false,
      } : null,
      security: {
        emailVerified: authUser.emailVerified ?? false,
        phoneVerified: authUser.phoneVerified ?? false,
        mfaEnabled: authUser.mfaEnabled ?? false,
        lastLoginAt: authUser.lastLoginAt || null,
        lastLoginIp: authUser.lastLoginIp || null,
        activeSessions: Array.isArray(sessions) ? sessions.length : 0,
      },
      organizations: (organizations || []).map((org: any) => ({
        id: org.organizationId || org.id || '',
        name: org.organization?.name || org.name || '',
        role: org.role || 'MEMBER',
        joinedAt: org.joinedAt || org.createdAt || new Date().toISOString(),
      })),
    };
  }

  /**
   * Builds content data section from collected data
   */
  private buildContentData(contentData: any): ContentData {
    const mediaData = contentData?.media?.data || contentData?.media || [];
    const contentItems = contentData?.content?.data || contentData?.content || [];
    const aiGenData = contentData?.aiGenerations?.data || contentData?.aiGenerations || [];
    const templateData = contentData?.templates?.data || contentData?.templates || [];

    return {
      media: (mediaData || []).map((m: any) => ({
        id: m.id,
        type: m.type,
        originalFilename: m.originalFilename,
        mimeType: m.mimeType,
        size: Number(m.size),
        url: m.url,
        status: m.status,
        createdAt: m.createdAt,
      })),
      content: (contentItems || []).map((c: any) => ({
        id: c.id,
        title: c.title || null,
        description: c.description || null,
        type: c.type,
        status: c.status,
        platform: c.platform || null,
        publishedAt: c.publishedAt || null,
        createdAt: c.createdAt,
      })),
      aiGenerations: (aiGenData || []).map((ai: any) => ({
        id: ai.id,
        type: ai.type,
        prompt: ai.prompt,
        model: ai.model,
        status: ai.status,
        resultUrl: ai.resultUrl || null,
        createdAt: ai.createdAt,
      })),
      templates: (templateData || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        category: t.category || null,
        isPublic: t.isPublic ?? false,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Builds transaction history section from collected data
   */
  private buildTransactionHistory(billingData: any): TransactionHistory {
    const subscription = billingData?.subscription || null;
    const invoicesData = billingData?.invoices?.invoices || billingData?.invoices || [];
    const paymentMethodsData = billingData?.paymentMethods || [];
    const usageData = billingData?.usage?.usage || billingData?.usage || [];

    return {
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan?.name || subscription.plan || 'FREE',
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAt: subscription.cancelAt || null,
        trialStart: subscription.trialStart || null,
        trialEnd: subscription.trialEnd || null,
      } : null,
      invoices: (invoicesData || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: String(inv.amount),
        tax: String(inv.tax || 0),
        total: String(inv.total),
        currency: inv.currency || 'USD',
        status: inv.status,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        paidAt: inv.paidAt || null,
      })),
      paymentMethods: (paymentMethodsData || []).map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        brand: pm.brand || null,
        last4: pm.last4,
        expiryMonth: pm.expiryMonth || null,
        expiryYear: pm.expiryYear || null,
        isDefault: pm.isDefault ?? false,
      })),
      usageRecords: (usageData || []).map((u: any) => ({
        type: u.type,
        quantity: String(u.quantity),
        unit: u.unit || 'unit',
        recordedAt: u.recordedAt,
      })),
    };
  }

  /**
   * Builds activity logs section from collected data
   */
  private buildActivityLogs(authData: any, campaignData: any, analyticsData: any): ActivityLogs {
    const sessions = authData?.sessions || [];
    const authUser = authData?.authUser || {};
    const applications = campaignData?.applications || [];
    const contentSubmissions = campaignData?.contentSubmissions || [];

    // Build auth logs from audit log if available
    const authLogs: Array<{ action: string; ipAddress: string | null; userAgent: string | null; createdAt: string }> = [];
    if (authUser.auditLogs && Array.isArray(authUser.auditLogs)) {
      authUser.auditLogs.forEach((log: any) => {
        authLogs.push({
          action: log.action,
          ipAddress: log.ipAddress || null,
          userAgent: log.userAgent || null,
          createdAt: log.createdAt,
        });
      });
    }

    return {
      authLogs,
      sessions: (sessions || []).map((s: any) => ({
        id: s.id,
        ipAddress: s.ipAddress || null,
        userAgent: s.userAgent || null,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt || s.createdAt,
        expiresAt: s.expiresAt,
      })),
      complianceAuditLogs: [], // Populated separately from local prisma
      campaignParticipations: (applications || []).map((app: any) => ({
        campaignId: app.campaignId,
        campaignName: app.campaign?.name || 'Unknown Campaign',
        status: app.status,
        appliedAt: app.createdAt,
        reviewedAt: app.reviewedAt || null,
      })),
      contentSubmissions: (contentSubmissions || []).map((cs: any) => ({
        contentId: cs.id,
        contentTitle: cs.title || null,
        campaignId: cs.campaignId,
        status: cs.status,
        submittedAt: cs.createdAt,
      })),
    };
  }

  /**
   * Builds communication preferences from collected data
   */
  private buildCommunicationPreferences(userData: any, consentRecords: ConsentRecords): CommunicationPreferences {
    const notifications = userData?.notifications || null;

    // Determine marketing and third-party consent from consent records
    const marketingConsent = consentRecords.consents.find(c => c.type === 'MARKETING');
    const thirdPartyConsent = consentRecords.consents.find(c => c.type === 'THIRD_PARTY');

    return {
      notifications: notifications ? {
        emailMarketing: notifications.emailMarketing ?? true,
        emailProductUpdates: notifications.emailProductUpdates ?? true,
        emailCampaignUpdates: notifications.emailCampaignUpdates ?? true,
        emailCreatorMessages: notifications.emailCreatorMessages ?? true,
        pushNotifications: notifications.pushNotifications ?? true,
        smsNotifications: notifications.smsNotifications ?? false,
      } : null,
      marketingConsent: marketingConsent?.granted ?? false,
      thirdPartyConsent: thirdPartyConsent?.granted ?? false,
    };
  }

  /**
   * Creates the export archive with JSON data and optional PDF summary
   */
  private async createExportArchive(requestId: string, userId: string, exportData: GDPRExportData): Promise<string> {
    const exportDir = config.storage.exportPath;
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const archivePath = path.join(exportDir, `${userId}-${requestId}.zip`);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve(archivePath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add main JSON data file
      archive.append(JSON.stringify(exportData, null, 2), {
        name: 'gdpr-export-data.json'
      });

      // Add individual category files for easier navigation
      archive.append(JSON.stringify(exportData.metadata, null, 2), {
        name: 'categories/00-metadata.json'
      });
      archive.append(JSON.stringify(exportData.personalInformation, null, 2), {
        name: 'categories/01-personal-information.json'
      });
      archive.append(JSON.stringify(exportData.accountSettings, null, 2), {
        name: 'categories/02-account-settings.json'
      });
      archive.append(JSON.stringify(exportData.contentData, null, 2), {
        name: 'categories/03-content-data.json'
      });
      archive.append(JSON.stringify(exportData.transactionHistory, null, 2), {
        name: 'categories/04-transaction-history.json'
      });
      archive.append(JSON.stringify(exportData.activityLogs, null, 2), {
        name: 'categories/05-activity-logs.json'
      });
      archive.append(JSON.stringify(exportData.consentRecords, null, 2), {
        name: 'categories/06-consent-records.json'
      });
      archive.append(JSON.stringify(exportData.communicationPreferences, null, 2), {
        name: 'categories/07-communication-preferences.json'
      });

      // Add README file
      const readmeContent = this.generateReadmeContent(exportData);
      archive.append(readmeContent, { name: 'README.txt' });

      // Generate and add PDF summary
      try {
        const pdfBuffer = this.generatePdfSummary(exportData);
        archive.append(pdfBuffer, { name: 'gdpr-export-summary.pdf' });
      } catch (pdfError) {
        logger.warn({ error: pdfError }, 'Failed to generate PDF summary, continuing without it');
      }

      archive.finalize();
    });
  }

  /**
   * Generates README content for the export
   */
  private generateReadmeContent(exportData: GDPRExportData): string {
    return `GDPR DATA EXPORT
================

Export ID: ${exportData.metadata.exportId}
Export Date: ${exportData.metadata.exportDate}
User ID: ${exportData.metadata.userId}

This archive contains all personal data associated with your account as required
under GDPR Article 20 (Right to Data Portability).

DATA CONTROLLER
---------------
${exportData.metadata.dataController}
Contact: ${exportData.metadata.contactEmail}

INCLUDED DATA CATEGORIES
------------------------
${exportData.metadata.dataCategories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

FILE STRUCTURE
--------------
- gdpr-export-data.json: Complete export in a single file
- gdpr-export-summary.pdf: Human-readable summary document
- categories/: Individual JSON files for each data category
  - 00-metadata.json: Export metadata
  - 01-personal-information.json: Your personal information
  - 02-account-settings.json: Account preferences and security settings
  - 03-content-data.json: Media and content you've created
  - 04-transaction-history.json: Billing and payment information
  - 05-activity-logs.json: Login history and platform activity
  - 06-consent-records.json: Your consent and rights agreements
  - 07-communication-preferences.json: Notification settings

YOUR RIGHTS
-----------
Under GDPR, you have the following rights:
- Right of access (Article 15)
- Right to rectification (Article 16)
- Right to erasure (Article 17)
- Right to restriction of processing (Article 18)
- Right to data portability (Article 20)
- Right to object (Article 21)

To exercise any of these rights, please contact: ${exportData.metadata.contactEmail}

This export was generated automatically by our GDPR compliance system.
`;
  }

  /**
   * Generates a PDF summary of the export data
   */
  private generatePdfSummary(exportData: GDPRExportData): Buffer {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50 });

    doc.on('data', (chunk) => chunks.push(chunk));

    // Title
    doc.fontSize(24).text('GDPR Data Export Summary', { align: 'center' });
    doc.moveDown();

    // Metadata
    doc.fontSize(14).text('Export Information', { underline: true });
    doc.fontSize(10);
    doc.text(`Export ID: ${exportData.metadata.exportId}`);
    doc.text(`Export Date: ${exportData.metadata.exportDate}`);
    doc.text(`User ID: ${exportData.metadata.userId}`);
    doc.text(`Data Controller: ${exportData.metadata.dataController}`);
    doc.text(`GDPR Article: ${exportData.metadata.gdprArticle}`);
    doc.moveDown();

    // Personal Information
    doc.fontSize(14).text('Personal Information', { underline: true });
    doc.fontSize(10);
    const pi = exportData.personalInformation;
    doc.text(`Name: ${pi.basicInfo.firstName || ''} ${pi.basicInfo.lastName || ''}`);
    doc.text(`Email: ${pi.basicInfo.email}`);
    doc.text(`Phone: ${pi.basicInfo.phoneNumber || 'Not provided'}`);
    doc.text(`Account Status: ${pi.accountStatus}`);
    doc.text(`Role: ${pi.role}`);
    doc.text(`Account Created: ${pi.createdAt}`);
    doc.moveDown();

    // Account Settings Summary
    doc.fontSize(14).text('Account Settings', { underline: true });
    doc.fontSize(10);
    const as = exportData.accountSettings;
    doc.text(`Email Verified: ${as.security.emailVerified ? 'Yes' : 'No'}`);
    doc.text(`MFA Enabled: ${as.security.mfaEnabled ? 'Yes' : 'No'}`);
    doc.text(`Active Sessions: ${as.security.activeSessions}`);
    doc.text(`Organizations: ${as.organizations.length}`);
    doc.moveDown();

    // Content Summary
    doc.fontSize(14).text('Content Summary', { underline: true });
    doc.fontSize(10);
    const cd = exportData.contentData;
    doc.text(`Media Files: ${cd.media.length}`);
    doc.text(`Content Items: ${cd.content.length}`);
    doc.text(`AI Generations: ${cd.aiGenerations.length}`);
    doc.text(`Templates: ${cd.templates.length}`);
    doc.moveDown();

    // Transaction Summary
    doc.fontSize(14).text('Transaction Summary', { underline: true });
    doc.fontSize(10);
    const th = exportData.transactionHistory;
    doc.text(`Subscription Plan: ${th.subscription?.plan || 'None'}`);
    doc.text(`Subscription Status: ${th.subscription?.status || 'N/A'}`);
    doc.text(`Total Invoices: ${th.invoices.length}`);
    doc.text(`Payment Methods: ${th.paymentMethods.length}`);
    doc.moveDown();

    // Consent Records Summary
    doc.fontSize(14).text('Consent Records', { underline: true });
    doc.fontSize(10);
    const cr = exportData.consentRecords;
    doc.text(`Consent Records: ${cr.consents.length}`);
    doc.text(`Content Rights Agreements: ${cr.contentRights.length}`);
    doc.text(`Disclosure Records: ${cr.disclosures.length}`);
    doc.moveDown();

    // Activity Summary
    doc.fontSize(14).text('Activity Summary', { underline: true });
    doc.fontSize(10);
    const al = exportData.activityLogs;
    doc.text(`Session Records: ${al.sessions.length}`);
    doc.text(`Auth Log Entries: ${al.authLogs.length}`);
    doc.text(`Campaign Applications: ${al.campaignParticipations.length}`);
    doc.text(`Content Submissions: ${al.contentSubmissions.length}`);
    doc.moveDown();

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(
      'This document is a summary of your GDPR data export. For complete data, please refer to the JSON files included in this archive.',
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toISOString()} | Contact: ${exportData.metadata.contactEmail}`,
      { align: 'center' }
    );

    doc.end();

    return Buffer.concat(chunks);
  }

  async requestDataDeletion(userId: string, notes?: string): Promise<string> {
    const request = await prisma.dataRequest.create({
      data: {
        userId,
        type: DataRequestType.DELETE,
        status: RequestStatus.PENDING,
        notes,
      },
    });

    logger.info({ userId, requestId: request.id }, 'Data deletion requested');
    return request.id;
  }

  async processDataDeletion(requestId: string): Promise<void> {
    const request = await prisma.dataRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.type !== DataRequestType.DELETE) {
      throw new Error('Invalid deletion request');
    }

    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.PROCESSING, processedAt: new Date() },
    });

    try {
      // Delete user data from compliance service database
      await prisma.$transaction([
        prisma.consent.deleteMany({ where: { userId: request.userId } }),
        prisma.disclosure.deleteMany({ where: { userId: request.userId } }),
        prisma.contentRights.deleteMany({ where: { creatorId: request.userId } }),
        prisma.auditLog.deleteMany({ where: { userId: request.userId } }),
      ]);

      // Notify other services to delete user data
      await this.notifyServicesForDeletion(request.userId);

      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.COMPLETED, completedAt: new Date() },
      });

      logger.info({ requestId, userId: request.userId }, 'Data deletion completed');
    } catch (error: any) {
      logger.error({ error, requestId }, 'Failed to delete data');
      await prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.FAILED, completedAt: new Date(), notes: error.message },
      });
      throw error;
    }
  }

  /**
   * Notifies other services to delete user data (GDPR Right to Erasure)
   */
  private async notifyServicesForDeletion(userId: string): Promise<void> {
    const services = [
      { url: SERVICE_URLS.userService, endpoint: '/users/gdpr/delete' },
      { url: SERVICE_URLS.authService, endpoint: '/auth/gdpr/delete' },
      { url: SERVICE_URLS.contentService, endpoint: '/content/gdpr/delete' },
      { url: SERVICE_URLS.campaignService, endpoint: '/campaigns/gdpr/delete' },
      { url: SERVICE_URLS.billingService, endpoint: '/billing/gdpr/delete' },
      { url: SERVICE_URLS.analyticsService, endpoint: '/analytics/gdpr/delete' },
    ];

    const results = await Promise.allSettled(
      services.map(async ({ url, endpoint }) => {
        const response = await fetch(`${url}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-Internal-Service': 'compliance-service',
            'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
          },
          body: JSON.stringify({ userId }),
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          throw new Error(`Service returned ${response.status}`);
        }

        return { url, success: true };
      })
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error({
          service: services[index].url,
          error: result.reason
        }, 'Failed to notify service for deletion');
      }
    });
  }

  /**
   * Gets the status of a data request
   */
  async getRequestStatus(requestId: string): Promise<any> {
    const request = await prisma.dataRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    return {
      id: request.id,
      type: request.type,
      status: request.status,
      requestedAt: request.requestedAt,
      processedAt: request.processedAt,
      completedAt: request.completedAt,
      expiresAt: request.expiresAt,
      downloadUrl: request.downloadUrl,
    };
  }

  /**
   * Lists all data requests for a user
   */
  async listUserRequests(userId: string): Promise<any[]> {
    const requests = await prisma.dataRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });

    return requests.map(r => ({
      id: r.id,
      type: r.type,
      status: r.status,
      requestedAt: r.requestedAt,
      completedAt: r.completedAt,
      expiresAt: r.expiresAt,
      downloadUrl: r.downloadUrl,
    }));
  }
}

export const gdprService = new GDPRService();
