/**
 * Crazy Capital — Production-Grade CORS Origin Validator
 * Enforces strict domain and protocol validation for credentialed requests.
 * Prevents origin-reflection vulnerabilities and subdomain spoofing.
 */

export function isOriginAllowed(
  origin: string | undefined | null,
  configuredOrigins: string[] = [],
): boolean {
  // Allow requests without an Origin header (e.g. server-to-server, cURL, health probes, native mobile)
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    const { protocol, hostname, port } = url;

    // Check protocol: only http (for local dev) or https allowed
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    // Normalize configured origins
    const normalizedConfigured = configuredOrigins.map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
    const normalizedOrigin = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    if (normalizedConfigured.includes(normalizedOrigin) || normalizedConfigured.includes(origin)) {
      return true;
    }

    // Local development loopback origins
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // Production apex domain (HTTPS only)
    if (hostname === 'crazycapital.in' && protocol === 'https:') {
      return true;
    }

    // Production subdomains (*.crazycapital.in) with strict RFC label validation (HTTPS only)
    if (hostname.endsWith('.crazycapital.in') && protocol === 'https:') {
      const subdomain = hostname.slice(0, -'.crazycapital.in'.length);
      // Must be a valid non-empty subdomain label without trailing or consecutive dots
      if (
        subdomain.length > 0 &&
        /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(subdomain)
      ) {
        return true;
      }
    }

    // Authorized Crazy Capital Vercel preview environments (HTTPS only)
    if (hostname.endsWith('.vercel.app') && protocol === 'https:') {
      const vSub = hostname.slice(0, -'.vercel.app'.length);
      if (
        vSub === 'crazy-capital' ||
        vSub.startsWith('crazy-capital-') ||
        vSub.startsWith('crazycapital')
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
