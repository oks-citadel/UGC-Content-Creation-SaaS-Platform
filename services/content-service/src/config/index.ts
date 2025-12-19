import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3004),
  serviceName: z.string().default('content-service'),

  database: z.object({
    url: z.string(),
  }),

  redis: z.object({
    url: z.string(),
  }),

  storage: z.object({
    connectionString: z.string(),
    containerName: z.string().default('content'),
    cdnEndpoint: z.string().optional(),
  }),

  upload: z.object({
    maxFileSize: z.coerce.number().default(500 * 1024 * 1024), // 500MB
    allowedImageTypes: z.string().transform((s) => s.split(',')).default('image/jpeg,image/png,image/gif,image/webp'),
    allowedVideoTypes: z.string().transform((s) => s.split(',')).default('video/mp4,video/webm,video/quicktime'),
  }),

  cors: z.object({
    origins: z.string().transform((s) => s.split(',')).default('http://localhost:3000'),
  }),

  aiServiceUrl: z.string().default('http://ai-service:8000'),
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
      containerName: process.env.AZURE_STORAGE_CONTENT_CONTAINER,
      cdnEndpoint: process.env.AZURE_CDN_ENDPOINT,
    },
    upload: {
      maxFileSize: process.env.MAX_FILE_SIZE,
      allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES,
      allowedVideoTypes: process.env.ALLOWED_VIDEO_TYPES,
    },
    cors: {
      origins: process.env.CORS_ORIGINS,
    },
    aiServiceUrl: process.env.AI_SERVICE_URL,
  });

  if (!result.success) {
    console.error('Configuration validation failed:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
};

export const config = parseConfig();
export type Config = z.infer<typeof configSchema>;
