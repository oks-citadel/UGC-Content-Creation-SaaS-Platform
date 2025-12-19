import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  port: z.coerce.number().default(8088),
  corsOrigins: z.string().transform((val) => val.split(',').map((s) => s.trim())).default('http://localhost:3000'),

  // Azure Blob Storage
  azureStorageConnectionString: z.string().optional(),
  azureStorageAccountName: z.string().optional(),
  azureStorageContainerName: z.string().default('assets'),

  // CDN
  cdnEndpoint: z.string().optional(),
  cdnCustomDomain: z.string().optional(),

  // Redis
  redisUrl: z.string().default('redis://localhost:6379'),

  // Upload limits
  maxFileSize: z.coerce.number().default(100 * 1024 * 1024), // 100MB
  maxImageSize: z.coerce.number().default(20 * 1024 * 1024), // 20MB
  maxVideoSize: z.coerce.number().default(500 * 1024 * 1024), // 500MB

  // Transcoding
  enableTranscoding: z.coerce.boolean().default(true),
  transcodingQueueUrl: z.string().optional(),

  // Presigned URL expiry
  uploadUrlExpiry: z.coerce.number().default(3600), // 1 hour
  downloadUrlExpiry: z.coerce.number().default(86400), // 24 hours
});

const envConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  corsOrigins: process.env.CORS_ORIGINS,
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  azureStorageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  azureStorageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
  cdnEndpoint: process.env.CDN_ENDPOINT,
  cdnCustomDomain: process.env.CDN_CUSTOM_DOMAIN,
  redisUrl: process.env.REDIS_URL,
  maxFileSize: process.env.MAX_FILE_SIZE,
  maxImageSize: process.env.MAX_IMAGE_SIZE,
  maxVideoSize: process.env.MAX_VIDEO_SIZE,
  enableTranscoding: process.env.ENABLE_TRANSCODING,
  transcodingQueueUrl: process.env.TRANSCODING_QUEUE_URL,
  uploadUrlExpiry: process.env.UPLOAD_URL_EXPIRY,
  downloadUrlExpiry: process.env.DOWNLOAD_URL_EXPIRY,
};

export const config = configSchema.parse(envConfig);

export type Config = z.infer<typeof configSchema>;
