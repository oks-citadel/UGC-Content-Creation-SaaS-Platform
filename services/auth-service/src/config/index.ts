import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),
  serviceName: z.string().default('auth-service'),

  database: z.object({
    url: z.string(),
  }),

  redis: z.object({
    url: z.string(),
  }),

  jwt: z.object({
    secret: z.string(),
    accessTokenExpiry: z.string().default('15m'),
    refreshTokenExpiry: z.string().default('7d'),
    issuer: z.string().default('nexus-platform'),
    audience: z.string().default('nexus-api'),
  }),

  oauth: z.object({
    google: z.object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      callbackUrl: z.string().optional(),
    }),
  }),

  email: z.object({
    verificationExpiry: z.coerce.number().default(24 * 60 * 60 * 1000), // 24 hours
  }),

  password: z.object({
    resetExpiry: z.coerce.number().default(60 * 60 * 1000), // 1 hour
    minLength: z.coerce.number().default(8),
    maxLoginAttempts: z.coerce.number().default(5),
    lockoutDuration: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  }),

  mfa: z.object({
    issuer: z.string().default('NEXUS Platform'),
    tokenWindow: z.coerce.number().default(1),
  }),

  cors: z.object({
    origins: z.string().transform((s) => s.split(',')).default('http://localhost:3000'),
  }),

  userServiceUrl: z.string().default('http://user-service:3002'),
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
    jwt: {
      secret: process.env.JWT_SECRET,
      accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
      },
    },
    email: {
      verificationExpiry: process.env.EMAIL_VERIFICATION_EXPIRY,
    },
    password: {
      resetExpiry: process.env.PASSWORD_RESET_EXPIRY,
      minLength: process.env.PASSWORD_MIN_LENGTH,
      maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS,
      lockoutDuration: process.env.LOCKOUT_DURATION,
    },
    mfa: {
      issuer: process.env.MFA_ISSUER,
      tokenWindow: process.env.MFA_TOKEN_WINDOW,
    },
    cors: {
      origins: process.env.CORS_ORIGINS,
    },
    userServiceUrl: process.env.USER_SERVICE_URL,
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
