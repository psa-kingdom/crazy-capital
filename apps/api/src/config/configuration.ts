export default () => {
  const defaultCors = [
    'http://localhost:3000',
    'http://localhost:3001',
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
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigin: envCors,
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'fallback-jwt-secret-for-dev-only-min-32-chars',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-dev-only-min-32-chars',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
  };
};

