import dotenv from 'dotenv';

dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:4000',

  db: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    privateKey: process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    // Fallback for development: use HS256 with a secret
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },

  storage: {
    r2AccountId: process.env.R2_ACCOUNT_ID || '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || 'truvis-media',
    r2PublicUrl: process.env.R2_PUBLIC_URL || '',
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@truvis.info',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@truvis.info',
  },

  security: {
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,       // 15 minutes
    max: 1000,                        // general
    authMax: 10,                      // auth endpoints
    uploadMax: 20,                    // upload endpoints
    contactMax: 5,                    // contact form
  },
} as const;
