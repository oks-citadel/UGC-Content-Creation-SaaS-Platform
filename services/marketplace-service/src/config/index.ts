import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
  server: {
    port: number;
    env: string;
    serviceName: string;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiry: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    connectClientId: string;
  };
  paystack: {
    secretKey: string;
    publicKey: string;
  };
  flutterwave: {
    secretKey: string;
    publicKey: string;
    encryptionKey: string;
  };
  docusign: {
    integrationKey: string;
    userId: string;
    accountId: string;
    privateKeyPath: string;
    oauthBasePath: string;
    apiBasePath: string;
  };
  currency: {
    default: string;
    supported: string[];
  };
  payout: {
    minAmount: number;
    processingFeePercent: number;
    processingFeeFixed: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  monitoring: {
    sentryDsn?: string;
    prometheusEnabled: boolean;
  };
  externalServices: {
    campaignServiceUrl: string;
    creatorServiceUrl: string;
    notificationServiceUrl: string;
  };
  ai: {
    openaiApiKey?: string;
    matchingEnabled: boolean;
  };
  storage: {
    s3Bucket: string;
    s3Region: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    contractTemplateBucket: string;
    defaultContractTemplateId: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3006', 10),
    env: process.env.NODE_ENV || 'development',
    serviceName: process.env.SERVICE_NAME || 'marketplace-service',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nexus_marketplace',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiry: process.env.JWT_EXPIRY || '24h',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID || '',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  },
  flutterwave: {
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
  },
  docusign: {
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
    userId: process.env.DOCUSIGN_USER_ID || '',
    accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
    privateKeyPath: process.env.DOCUSIGN_PRIVATE_KEY_PATH || './keys/docusign-private.key',
    oauthBasePath: process.env.DOCUSIGN_OAUTH_BASE_PATH || 'https://account-d.docusign.com',
    apiBasePath: process.env.DOCUSIGN_API_BASE_PATH || 'https://demo.docusign.net/restapi',
  },
  currency: {
    default: process.env.DEFAULT_CURRENCY || 'USD',
    supported: (process.env.SUPPORTED_CURRENCIES || 'USD,EUR,GBP,NGN,KES,GHS,ZAR').split(','),
  },
  payout: {
    minAmount: parseFloat(process.env.MIN_PAYOUT_AMOUNT || '50'),
    processingFeePercent: parseFloat(process.env.PAYOUT_PROCESSING_FEE_PERCENT || '2.5'),
    processingFeeFixed: parseFloat(process.env.PAYOUT_PROCESSING_FEE_FIXED || '0.30'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
  },
  externalServices: {
    campaignServiceUrl: process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:3003',
    creatorServiceUrl: process.env.CREATOR_SERVICE_URL || 'http://localhost:3004',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    matchingEnabled: process.env.AI_MATCHING_ENABLED === 'true',
  },
  storage: {
    s3Bucket: process.env.S3_BUCKET || 'nexus-marketplace-contracts',
    s3Region: process.env.S3_REGION || 'us-east-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    contractTemplateBucket: process.env.CONTRACT_TEMPLATE_BUCKET || 'nexus-contract-templates',
    defaultContractTemplateId: process.env.DEFAULT_CONTRACT_TEMPLATE_ID || 'default-ugc-contract-v1',
  },
};

// Validation
export function validateConfig(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Warn about missing payment provider keys in production
  if (config.server.env === 'production') {
    if (!config.stripe.secretKey) {
      console.warn('WARNING: Stripe secret key not configured');
    }
  }
}

export default config;
