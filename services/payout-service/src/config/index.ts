import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  port: z.coerce.number().default(8091),
  corsOrigins: z.string().transform((val) => val.split(',').map((s) => s.trim())).default('http://localhost:3000'),

  // Database
  databaseUrl: z.string().default('postgresql://localhost:5432/payouts'),

  // Redis
  redisUrl: z.string().default('redis://localhost:6379'),

  // Stripe Connect
  stripeSecretKey: z.string().optional(),
  stripeConnectClientId: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),

  // Payout settings
  minimumPayoutAmount: z.coerce.number().default(50), // $50 minimum
  payoutProcessingDays: z.coerce.number().default(7), // 7 days after approval
  platformFeePercent: z.coerce.number().default(15), // 15% platform fee (varies by tier)

  // Supported currencies
  supportedCurrencies: z.string().transform((val) => val.split(',')).default('USD,EUR,GBP,CAD,AUD'),
});

const envConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  corsOrigins: process.env.CORS_ORIGINS,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeConnectClientId: process.env.STRIPE_CONNECT_CLIENT_ID,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  minimumPayoutAmount: process.env.MINIMUM_PAYOUT_AMOUNT,
  payoutProcessingDays: process.env.PAYOUT_PROCESSING_DAYS,
  platformFeePercent: process.env.PLATFORM_FEE_PERCENT,
  supportedCurrencies: process.env.SUPPORTED_CURRENCIES,
};

export const config = configSchema.parse(envConfig);

export type Config = z.infer<typeof configSchema>;
