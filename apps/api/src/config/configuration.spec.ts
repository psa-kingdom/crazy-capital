import {
  validateProductionSecrets,
  INSECURE_DEV_JWT_FALLBACKS,
  INSECURE_DEV_REFRESH_FALLBACKS,
} from './configuration';

describe('Production Configuration & Secret Validator', () => {
  const validProductionParams = {
    nodeEnv: 'production',
    databaseUrl: 'postgresql://user:pass@ep-prod-db.railway.internal:5432/crazy_capital',
    jwtSecret: 'a-very-strong-production-jwt-access-token-secret-key-64-bytes-min',
    jwtRefreshSecret: 'a-very-strong-production-jwt-refresh-token-secret-key-64-bytes-min',
  };

  describe('Non-Production Environments (Dev/Test)', () => {
    it('should allow missing or fallback secrets in development mode', () => {
      expect(() =>
        validateProductionSecrets({
          nodeEnv: 'development',
          jwtSecret: 'fallback-jwt-secret-for-dev-only-min-32-chars',
        }),
      ).not.toThrow();
    });

    it('should allow missing secrets in test mode', () => {
      expect(() =>
        validateProductionSecrets({
          nodeEnv: 'test',
        }),
      ).not.toThrow();
    });
  });

  describe('Production Environment Fail-Closed Rules', () => {
    it('should pass cleanly when all production secrets are valid and strong', () => {
      expect(() => validateProductionSecrets(validProductionParams)).not.toThrow();
    });

    it('should reject production when DATABASE_URL is missing or empty', () => {
      expect(() =>
        validateProductionSecrets({
          ...validProductionParams,
          databaseUrl: '',
        }),
      ).toThrow('DATABASE_URL is missing or empty in production');
    });

    it('should reject production when JWT_SECRET is missing or empty', () => {
      expect(() =>
        validateProductionSecrets({
          ...validProductionParams,
          jwtSecret: '',
        }),
      ).toThrow('JWT_SECRET is required in production');
    });

    it('should reject production when JWT_SECRET is less than 32 characters', () => {
      expect(() =>
        validateProductionSecrets({
          ...validProductionParams,
          jwtSecret: 'too-short-secret-16',
        }),
      ).toThrow('JWT_SECRET must be at least 32 characters long in production');
    });

    it('should reject production when JWT_SECRET is set to known insecure dev fallback', () => {
      for (const fallback of INSECURE_DEV_JWT_FALLBACKS) {
        expect(() =>
          validateProductionSecrets({
            ...validProductionParams,
            jwtSecret: fallback,
          }),
        ).toThrow('JWT_SECRET is set to an insecure development placeholder in production');
      }
    });

    it('should reject production when JWT_REFRESH_SECRET is missing or empty', () => {
      expect(() =>
        validateProductionSecrets({
          ...validProductionParams,
          jwtRefreshSecret: '',
        }),
      ).toThrow('JWT_REFRESH_SECRET is required in production');
    });

    it('should reject production when JWT_REFRESH_SECRET is less than 32 characters', () => {
      expect(() =>
        validateProductionSecrets({
          ...validProductionParams,
          jwtRefreshSecret: 'short-refresh-secret',
        }),
      ).toThrow('JWT_REFRESH_SECRET must be at least 32 characters long in production');
    });

    it('should reject production when JWT_REFRESH_SECRET is set to known insecure dev fallback', () => {
      for (const fallback of INSECURE_DEV_REFRESH_FALLBACKS) {
        expect(() =>
          validateProductionSecrets({
            ...validProductionParams,
            jwtRefreshSecret: fallback,
          }),
        ).toThrow('JWT_REFRESH_SECRET is set to an insecure development placeholder in production');
      }
    });
  });
});
