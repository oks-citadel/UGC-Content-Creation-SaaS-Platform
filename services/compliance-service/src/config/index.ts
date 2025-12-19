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
};
