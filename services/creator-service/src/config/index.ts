import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3003'),
  SERVICE_NAME: z.string().default('creator-service'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Service URLs
  API_GATEWAY_URL: z.string().url().optional(),
  AUTH_SERVICE_URL: z.string().url().optional(),
  CAMPAIGN_SERVICE_URL: z.string().url().optional(),
  CONTENT_SERVICE_URL: z.string().url().optional(),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,video/mp4'),

  // Matching Algorithm
  MIN_ENGAGEMENT_RATE: z.string().transform(Number).default('0.01'),
  MIN_FOLLOWERS: z.string().transform(Number).default('1000'),
  MAX_RECOMMENDATION_COUNT: z.string().transform(Number).default('20'),

  // Payout
  MIN_PAYOUT_AMOUNT: z.string().transform(Number).default('50.00'),
  PAYOUT_PROCESSING_FEE: z.string().transform(Number).default('2.50'),
});

type ConfigSchema = z.infer<typeof configSchema>;

class Config {
  private static instance: Config;
  private config: ConfigSchema;

  private constructor() {
    try {
      this.config = configSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:');
        error.errors.forEach((err) => {
          console.error(`  ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
      }
      throw error;
    }
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    return this.config[key];
  }

  public getAll(): ConfigSchema {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  public getCorsOrigins(): string[] {
    return this.config.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }

  public getAllowedFileTypes(): string[] {
    return this.config.ALLOWED_FILE_TYPES.split(',').map(type => type.trim());
  }
}

export const config = Config.getInstance();
export default config;
