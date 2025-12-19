export const config = {
  serviceName: 'notification-service',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3008', 10),
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@nexusplatform.io',
    fromName: process.env.SENDGRID_FROM_NAME || 'NEXUS Platform',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    token: process.env.SLACK_TOKEN || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  notification: {
    maxRetries: parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3', 10),
    retryDelayMinutes: parseInt(process.env.NOTIFICATION_RETRY_DELAY_MINUTES || '5', 10),
    batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || '100', 10),
  },
};
