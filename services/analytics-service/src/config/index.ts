import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3007', 10),
  wsPort: parseInt(process.env.WS_PORT || '3017', 10),
  serviceName: process.env.SERVICE_NAME || 'analytics-service',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  },

  services: {
    content: process.env.CONTENT_SERVICE_URL || 'http://localhost:3001',
    campaign: process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:3002',
    creator: process.env.CREATOR_SERVICE_URL || 'http://localhost:3003',
    commerce: process.env.COMMERCE_SERVICE_URL || 'http://localhost:3006',
  },

  storage: {
    reportPath: process.env.REPORT_STORAGE_PATH || '/tmp/nexus-reports',
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.FROM_EMAIL || 'reports@nexusplatform.io',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  },

  anomaly: {
    enabled: process.env.ANOMALY_DETECTION_ENABLED === 'true',
    thresholdStdDev: parseFloat(process.env.ANOMALY_THRESHOLD_STDDEV || '2.5'),
  },

  fatigue: {
    enabled: process.env.FATIGUE_CHECK_ENABLED === 'true',
  },

  reports: {
    maxSizeMb: parseInt(process.env.MAX_REPORT_SIZE_MB || '50', 10),
    retentionDays: parseInt(process.env.REPORT_RETENTION_DAYS || '90', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
