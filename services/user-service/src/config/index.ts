import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3002),
  serviceName: z.string().default('user-service'),

  database: z.object({
    url: z.string(),
  }),

  redis: z.object({
    url: z.string(),
  }),

  storage: z.object({
    connectionString: z.string().optional(),
    containerName: z.string().default('avatars'),
  }),

  cors: z.object({
    origins: z.string().transform((s) => s.split(',')).default('http://localhost:3000'),
  }),
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
    storage: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName: process.env.AZURE_STORAGE_AVATAR_CONTAINER,
    },
    cors: {
      origins: process.env.CORS_ORIGINS,
    },
  });

  if (!result.success) {
    console.error('Configuration validation failed:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
};

export const config = parseConfig();
export type Config = z.infer<typeof configSchema>;
