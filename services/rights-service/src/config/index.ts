import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  port: z.coerce.number().default(8089),
  corsOrigins: z.string().transform((val) => val.split(',').map((s) => s.trim())).default('http://localhost:3000'),

  // Database
  databaseUrl: z.string().default('postgresql://localhost:5432/rights'),

  // Redis
  redisUrl: z.string().default('redis://localhost:6379'),

  // JWT for license signing
  licenseSigningKey: z.string().optional(),

  // E-signature provider
  esignProvider: z.enum(['docusign', 'hellosign', 'internal']).default('internal'),
  esignApiKey: z.string().optional(),

  // License templates storage
  templatesPath: z.string().default('./templates'),
});

const envConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  corsOrigins: process.env.CORS_ORIGINS,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  licenseSigningKey: process.env.LICENSE_SIGNING_KEY,
  esignProvider: process.env.ESIGN_PROVIDER,
  esignApiKey: process.env.ESIGN_API_KEY,
  templatesPath: process.env.TEMPLATES_PATH,
};

export const config = configSchema.parse(envConfig);

export type Config = z.infer<typeof configSchema>;
