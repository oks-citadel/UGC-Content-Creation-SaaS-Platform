export const config = {
  serviceName: 'compliance-service',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3011', 10),
  cors: { origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'] },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  gdpr: {
    dataExportExpiryDays: parseInt(process.env.GDPR_EXPORT_EXPIRY_DAYS || '30', 10),
    deletionGracePeriodDays: parseInt(process.env.GDPR_DELETION_GRACE_DAYS || '30', 10),
  },
  storage: {
    exportPath: process.env.EXPORT_STORAGE_PATH || '/tmp/exports',
  },
  // Service URLs for inter-service communication
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://user-service:3002',
    authService: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    contentService: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
    campaignService: process.env.CAMPAIGN_SERVICE_URL || 'http://campaign-service:3005',
    billingService: process.env.BILLING_SERVICE_URL || 'http://billing-service:3007',
    analyticsService: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3006',
  },
  // GDPR Data Controller information
  dataController: {
    name: process.env.DATA_CONTROLLER_NAME || 'UGC Platform Inc.',
    dpoEmail: process.env.DPO_EMAIL || 'dpo@example.com',
  },
  // Internal service authentication
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
};
