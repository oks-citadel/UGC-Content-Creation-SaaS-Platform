export const config = {
  serviceName: 'integration-service',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3009', 10),
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  oauth: {
    callbackBaseUrl: process.env.OAUTH_CALLBACK_BASE_URL || 'http://localhost:3009/integrations/oauth/callback',
  },
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
  },
  meta: {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
  },
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
  },
  salesforce: {
    clientId: process.env.SALESFORCE_CLIENT_ID || '',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
  },
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
  },
  googleAds: {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
  },
  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '5000', 10),
  },
};
