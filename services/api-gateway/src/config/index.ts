// =============================================================================
// API Gateway Configuration
// =============================================================================

import { z } from 'zod';

const configSchema = z.object({
  env: z.enum(['development', 'staging', 'production']).default('development'),
  port: z.coerce.number().default(4000),

  cors: z.object({
    origins: z.array(z.string()).default(['http://localhost:3000']),
  }),

  rateLimit: z.object({
    windowMs: z.coerce.number().default(60000),
    max: z.coerce.number().default(100),
  }),

  jwt: z.object({
    secret: z.string().optional(),
    issuer: z.string().default('https://nexusugc.com'),
    audience: z.string().default('nexus-api'),
    jwksUri: z.string().optional(),
  }),

  internalAuth: z.object({
    secret: z.string().min(32),
    issuer: z.string().default('nexus-api-gateway'),
    audience: z.string().default('nexus-internal-services'),
    tokenTtl: z.coerce.number().default(300), // 5 minutes
  }),

  services: z.object({
    auth: z.string().default('http://auth-service:3001'),
    user: z.string().default('http://user-service:3002'),
    campaign: z.string().default('http://campaign-service:3003'),
    content: z.string().default('http://content-service:3004'),
    creator: z.string().default('http://creator-service:3005'),
    marketplace: z.string().default('http://marketplace-service:3006'),
    commerce: z.string().default('http://commerce-service:3007'),
    analytics: z.string().default('http://analytics-service:3008'),
    notification: z.string().default('http://notification-service:3009'),
    integration: z.string().default('http://integration-service:3010'),
    billing: z.string().default('http://billing-service:3011'),
  }),
});

function loadConfig() {
  const rawConfig = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,

    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    },

    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      max: process.env.RATE_LIMIT_MAX,
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      jwksUri: process.env.JWKS_URI,
    },

    internalAuth: {
      secret: process.env.INTERNAL_SERVICE_SECRET || '',
      issuer: process.env.INTERNAL_SERVICE_ISSUER || 'nexus-api-gateway',
      audience: process.env.INTERNAL_SERVICE_AUDIENCE || 'nexus-internal-services',
      tokenTtl: process.env.INTERNAL_TOKEN_TTL || 300,
    },

    services: {
      auth: process.env.AUTH_SERVICE_URL,
      user: process.env.USER_SERVICE_URL,
      campaign: process.env.CAMPAIGN_SERVICE_URL,
      content: process.env.CONTENT_SERVICE_URL,
      creator: process.env.CREATOR_SERVICE_URL,
      marketplace: process.env.MARKETPLACE_SERVICE_URL,
      commerce: process.env.COMMERCE_SERVICE_URL,
      analytics: process.env.ANALYTICS_SERVICE_URL,
      notification: process.env.NOTIFICATION_SERVICE_URL,
      integration: process.env.INTEGRATION_SERVICE_URL,
      billing: process.env.BILLING_SERVICE_URL,
    },
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error('Invalid configuration:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
}

export const config = loadConfig();

export type Config = z.infer<typeof configSchema>;
