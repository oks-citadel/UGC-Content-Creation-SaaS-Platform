import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3007),
  serviceName: z.string().default('activation-service'),
  logLevel: z.string().default('info'),

  database: z.object({
    url: z.string(),
  }),

  redis: z.object({
    url: z.string(),
  }),

  cors: z.object({
    origins: z.string().transform((s) => s.split(',')).default('http://localhost:3000'),
  }),

  cdnUrl: z.string().default('https://cdn.nexus-ugc.com'),
  embedUrl: z.string().default('https://embed.nexus-ugc.com'),
  contentServiceUrl: z.string().default('http://content-service:3004'),
  campaignServiceUrl: z.string().default('http://campaign-service:3003'),
});

const parseConfig = () => {
  const result = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    serviceName: process.env.SERVICE_NAME,
    logLevel: process.env.LOG_LEVEL,
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    cors: {
      origins: process.env.CORS_ORIGINS,
    },
    cdnUrl: process.env.CDN_URL,
    embedUrl: process.env.EMBED_URL,
    contentServiceUrl: process.env.CONTENT_SERVICE_URL,
    campaignServiceUrl: process.env.CAMPAIGN_SERVICE_URL,
  });

  if (!result.success) {
    console.error('Configuration validation failed:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
};

export const config = parseConfig();
export type Config = z.infer<typeof configSchema>;
