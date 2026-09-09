export const INSECURE_DEV_JWT_FALLBACKS = [
  'fallback-jwt-secret-for-dev-only-min-32-chars',
  'super-secret-jwt-key-change-in-production-min-32-chars',
  'change-me-in-production-secret-min-32',
];

export const INSECURE_DEV_REFRESH_FALLBACKS = [
  'fallback-refresh-secret-for-dev-only-min-32-chars',
  'super-secret-refresh-key-change-in-production-min-32-chars',
  'change-me-in-production-refresh-min-32',
];

export interface ProductionSecretParams {
  nodeEnv?: string;
  databaseUrl?: string;
  jwtSecret?: string;
  jwtRefreshSecret?: string;
}

export function validateProductionSecrets(params: ProductionSecretParams): void {
  const { nodeEnv, databaseUrl, jwtSecret, jwtRefreshSecret } = params;
  if (nodeEnv !== 'production') {
    return;
  }

  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error('FATAL CONFIGURATION ERROR: DATABASE_URL is missing or empty in production environment.');
  }

  if (!jwtSecret || jwtSecret.trim() === '') {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET is required in production environment.');
  }

  if (jwtSecret.length < 32) {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters long in production.');
  }

  if (INSECURE_DEV_JWT_FALLBACKS.includes(jwtSecret.trim())) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_SECRET is set to an insecure development placeholder in production.',
    );
  }

  if (!jwtRefreshSecret || jwtRefreshSecret.trim() === '') {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_REFRESH_SECRET is required in production environment.');
  }

  if (jwtRefreshSecret.length < 32) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_REFRESH_SECRET must be at least 32 characters long in production.',
    );
  }

  if (INSECURE_DEV_REFRESH_FALLBACKS.includes(jwtRefreshSecret.trim())) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_REFRESH_SECRET is set to an insecure development placeholder in production.',
    );
  }
}

export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-for-dev-only-min-32-chars';
  const jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-dev-only-min-32-chars';

  // Enforce fail-closed security validation in production
  validateProductionSecrets({
    nodeEnv,
    databaseUrl,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  });

  const defaultCors = [
    'http://localhost:3000',
    'https://crazycapital.in',
    'https://www.crazycapital.in',
    'https://admin.crazycapital.in',
    'https://api.crazycapital.in',
  ];

  const envCors = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : defaultCors;

  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv,
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigin: envCors,
    database: {
      url: databaseUrl,
    },
    jwt: {
      secret: jwtSecret,
      refreshSecret: jwtRefreshSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
  };
};
