import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  redis: {
    url: string;
  };
  services: {
    userService: string;
    notificationService: string;
  };
  internalAuth: {
    secret: string;
    issuer: string;
    audience: string;
  };
  billing: {
    trialPeriodDays: number;
    dunningMaxRetries: number;
    dunningRetryIntervalHours: number;
    invoiceDueDays: number;
  };
  features: {
    usageBasedBilling: boolean;
    overageBilling: boolean;
    proratedBilling: boolean;
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  },
  internalAuth: {
    secret: process.env.INTERNAL_SERVICE_SECRET || '',
    issuer: process.env.INTERNAL_SERVICE_ISSUER || 'nexus-api-gateway',
    audience: process.env.INTERNAL_SERVICE_AUDIENCE || 'nexus-internal-services',
  },
  billing: {
    trialPeriodDays: parseInt(process.env.TRIAL_PERIOD_DAYS || '14', 10),
    dunningMaxRetries: parseInt(process.env.DUNNING_MAX_RETRIES || '3', 10),
    dunningRetryIntervalHours: parseInt(process.env.DUNNING_RETRY_INTERVAL_HOURS || '72', 10),
    invoiceDueDays: parseInt(process.env.INVOICE_DUE_DAYS || '7', 10),
  },
  features: {
    usageBasedBilling: process.env.ENABLE_USAGE_BASED_BILLING === 'true',
    overageBilling: process.env.ENABLE_OVERAGE_BILLING === 'true',
    proratedBilling: process.env.ENABLE_PRORATED_BILLING === 'true',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required configuration
const validateConfig = () => {
  const missing: string[] = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.stripe.secretKey) missing.push('STRIPE_SECRET_KEY');
  if (!config.stripe.publishableKey) missing.push('STRIPE_PUBLISHABLE_KEY');
  if (missing.length > 0) {
    throw new Error('Missing required environment variables: ' + missing.join(', '));
  }
};

if (config.nodeEnv !== 'test') {
  validateConfig();
}

export default config;
