# ADR-023 - Strict Origin Validation for Credentialed CORS Requests

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-09 |
| Decider | Architecture Team / Security Lead |
| Category | API Security & CORS Policy |

---

## Context

Prior to stabilization, the NestJS API in `apps/api/src/main.ts` utilized custom Express middleware that dynamically reflected any incoming `Origin` header into `Access-Control-Allow-Origin` while concurrently enabling `Access-Control-Allow-Credentials: true`.

This configuration introduced a severe Cross-Origin Resource Sharing (CORS) vulnerability: any third-party malicious website (e.g. `https://evil.com`) could execute authenticated, credentialed browser API requests against the Crazy Capital API on behalf of an authenticated user, circumventing Same-Origin Policy protections.

Furthermore, naive string substring validation (such as `origin.includes('crazycapital.in')`) was vulnerable to domain hijacking and spoofing (e.g., `https://crazycapital.in.attacker.com`).

## Decision

1. **Eliminate Raw Origin Reflection Middleware**: Completely remove the custom Express middleware reflecting `req.headers.origin`.
2. **Unified NestJS CORS Configuration**: Implement a single, robust origin validation function (`isOriginAllowed`) used by both NestJS's CORS engine and the global `HttpExceptionFilter`.
3. **Strict Domain and Protocol Matching**:
   - Explicitly permit apex domain: `https://crazycapital.in`.
   - Strictly validate subdomains using anchored regular expressions: `^https://([a-zA-Z0-9-]+\.)*crazycapital\.in$` to reject spoofed domains like `crazycapital.in.evil.com`.
   - Permit explicitly configured localhost origins for development (e.g., `http://localhost:3000`, `http://127.0.0.1:3000`).
   - Permit non-browser requests (e.g. server-to-server, mobile native, curl, health checks) where `Origin` is `undefined`.
   - Permit custom origins passed via `CORS_ORIGIN` environment variable only if they are valid URLs.
4. **Credential Safety**: `Access-Control-Allow-Credentials: true` is only sent to strictly verified, trusted origins.

## Consequences

### Security Posture
- Untrusted origins are blocked at the browser layer from making credentialed requests or reading sensitive response payloads.
- Error responses from `HttpExceptionFilter` no longer blindly reflect untrusted origins.

### Testing
- Automated unit test suite (`cors.util.spec.ts`) covers accepted production domains, subdomains, local frontend origins, non-browser requests, and blocks attack vectors (arbitrary origins, substring prefix/suffix spoofs, null origins, and insecure schemes).

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Retain origin reflection with credential support | High severity vulnerability allowing arbitrary cross-origin data exfiltration. |
| Wildcard `*` with credentials | Prohibited by W3C CORS specification and blocked by modern browsers. |
| Naive `origin.includes(...)` | Vulnerable to substring bypass attacks (e.g. `crazycapital.in.evil.com`). |
