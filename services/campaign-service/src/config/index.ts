import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3003),
  serviceName: z.string().default('campaign-service'),

  database: z.object({
    url: z.string(),
  }),

  redis: z.object({
    url: z.string(),
  }),

  cors: z.object({
    origins: z.string().transform((s) => s.split(',')).default('http://localhost:3000'),
  }),

  creatorServiceUrl: z.string().default('http://creator-service:3005'),
  notificationServiceUrl: z.string().default('http://notification-service:3009'),
});

const parseConfig = () => {
  const result = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    serviceName: process.env.SERVICE_NAME,
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    cors: {
      origins: process.env.CORS_ORIGINS,
    },
    creatorServiceUrl: process.env.CREATOR_SERVICE_URL,
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL,
  });

  if (!result.success) {
    console.error('Configuration validation failed:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
};

export const config = parseConfig();
export type Config = z.infer<typeof configSchema>;
