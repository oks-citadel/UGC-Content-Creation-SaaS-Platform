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
    host: string;
    port: number;
    password: string;
    db: number;
  };
  rabbitmq: {
    url: string;
    exchange: string;
    queue: string;
  };
  shopify: {
    apiKey: string;
    apiSecret: string;
    apiVersion: string;
  };
  woocommerce: {
    url: string;
    consumerKey: string;
    consumerSecret: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
  services: {
    aiService: {
      url: string;
      apiKey: string;
    };
    contentService: {
      url: string;
    };
    analyticsService: {
      url: string;
    };
  };
  attribution: {
    windowDays: number;
    defaultModel: string;
  };
  checkout: {
    sessionTimeoutMinutes: number;
    orderFulfillmentWebhook: string;
  };
  features: {
    enableAutoProductDetection: boolean;
    enableRealTimeAttribution: boolean;
    enableMultiCurrency: boolean;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3006', 10),
    env: process.env.NODE_ENV || 'development',
    serviceName: process.env.SERVICE_NAME || 'commerce-service',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexus_commerce',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'nexus_events',
    queue: process.env.RABBITMQ_QUEUE || 'commerce_queue',
  },
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
  },
  woocommerce: {
    url: process.env.WOOCOMMERCE_URL || '',
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  services: {
    aiService: {
      url: process.env.AI_SERVICE_URL || 'http://localhost:3002',
      apiKey: process.env.AI_SERVICE_API_KEY || '',
    },
    contentService: {
      url: process.env.CONTENT_SERVICE_URL || 'http://localhost:3003',
    },
    analyticsService: {
      url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
    },
  },
  attribution: {
    windowDays: parseInt(process.env.ATTRIBUTION_WINDOW_DAYS || '30', 10),
    defaultModel: process.env.DEFAULT_ATTRIBUTION_MODEL || 'last_touch',
  },
  checkout: {
    sessionTimeoutMinutes: parseInt(process.env.CHECKOUT_SESSION_TIMEOUT_MINUTES || '30', 10),
    orderFulfillmentWebhook: process.env.ORDER_FULFILLMENT_WEBHOOK || '',
  },
  features: {
    enableAutoProductDetection: process.env.ENABLE_AUTO_PRODUCT_DETECTION === 'true',
    enableRealTimeAttribution: process.env.ENABLE_REAL_TIME_ATTRIBUTION === 'true',
    enableMultiCurrency: process.env.ENABLE_MULTI_CURRENCY === 'true',
  },
};

// Validate required configuration
const validateConfig = (): void => {
  const requiredFields: (keyof Config)[] = ['database'];
  const missingFields: string[] = [];

  if (!config.database.url) {
    missingFields.push('DATABASE_URL');
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required configuration: ${missingFields.join(', ')}`
    );
  }

  // Warn about missing integrations
  if (!config.shopify.apiKey && !config.woocommerce.url) {
    console.warn('Warning: No e-commerce integrations configured (Shopify or WooCommerce)');
  }
};

// Run validation
if (config.server.env !== 'test') {
  validateConfig();
}

export default config;
