import { isOriginAllowed } from './cors.util';

describe('CORS Origin Validator (isOriginAllowed)', () => {
  describe('Accepted Origins', () => {
    it('should allow requests with undefined origin (curl, server-to-server, health checks)', () => {
      expect(isOriginAllowed(undefined)).toBe(true);
      expect(isOriginAllowed(null)).toBe(true);
      expect(isOriginAllowed('')).toBe(true);
    });

    it('should allow canonical production apex domain via HTTPS', () => {
      expect(isOriginAllowed('https://crazycapital.in')).toBe(true);
    });

    it('should allow legitimate Crazy Capital production subdomains via HTTPS', () => {
      expect(isOriginAllowed('https://api.crazycapital.in')).toBe(true);
      expect(isOriginAllowed('https://admin.crazycapital.in')).toBe(true);
      expect(isOriginAllowed('https://staging.crazycapital.in')).toBe(true);
      expect(isOriginAllowed('https://tenant-alpha.crazycapital.in')).toBe(true);
    });

    it('should allow local development loopback origins', () => {
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(isOriginAllowed('http://localhost:4000')).toBe(true);
      expect(isOriginAllowed('http://127.0.0.1:3000')).toBe(true);
    });

    it('should allow authorized Crazy Capital Vercel preview environments', () => {
      expect(isOriginAllowed('https://crazy-capital.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://crazy-capital-preview-123.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://crazycapital.vercel.app')).toBe(true);
    });

    it('should allow explicitly configured origins passed via parameter', () => {
      const configured = ['https://custom-partner.portal.in', 'https://enterprise-tenant.com'];
      expect(isOriginAllowed('https://custom-partner.portal.in', configured)).toBe(true);
      expect(isOriginAllowed('https://enterprise-tenant.com', configured)).toBe(true);
    });
  });

  describe('Rejected Origins (Attack & Spoofing Mitigation)', () => {
    it('should reject arbitrary malicious domains', () => {
      expect(isOriginAllowed('https://evil.com')).toBe(false);
      expect(isOriginAllowed('https://attacker-site.org')).toBe(false);
      expect(isOriginAllowed('http://malicious-node.xyz')).toBe(false);
    });

    it('should reject subdomain suffix spoofing (e.g. crazycapital.in.attacker.com)', () => {
      expect(isOriginAllowed('https://crazycapital.in.attacker.com')).toBe(false);
      expect(isOriginAllowed('https://admin.crazycapital.in.evil.com')).toBe(false);
    });

    it('should reject domain prefix spoofing (e.g. evil-crazycapital.in)', () => {
      expect(isOriginAllowed('https://evil-crazycapital.in')).toBe(false);
      expect(isOriginAllowed('https://fakecrazycapital.in')).toBe(false);
    });

    it('should reject non-HTTPS production origins', () => {
      expect(isOriginAllowed('http://crazycapital.in')).toBe(false);
      expect(isOriginAllowed('http://api.crazycapital.in')).toBe(false);
    });

    it('should reject arbitrary unauthorized Vercel deployments', () => {
      expect(isOriginAllowed('https://unrelated-app.vercel.app')).toBe(false);
      expect(isOriginAllowed('https://attacker-phishing.vercel.app')).toBe(false);
    });

    it('should reject invalid or malicious protocol schemes', () => {
      expect(isOriginAllowed('javascript:alert(1)')).toBe(false);
      expect(isOriginAllowed('ftp://crazycapital.in')).toBe(false);
      expect(isOriginAllowed('data:text/html,evil')).toBe(false);
      expect(isOriginAllowed('not-a-valid-url')).toBe(false);
    });
  });
});
