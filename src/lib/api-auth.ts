import type { APIContext } from "astro";
import type { User, Session } from "./auth";

export interface AuthenticatedAdminContext {
  user: User;
  session: Session;
}

/**
 * Validates that state-changing requests (POST, PUT, PATCH, DELETE)
 * originate from the same origin to protect against Cross-Site Request Forgery (CSRF).
 * Fully handles reverse proxy headers (x-forwarded-host, host) for custom domains behind Cloudflare.
 */
export function validateSameOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  // Safe HTTP methods do not mutate state
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const requestUrl = new URL(request.url);

  // Normalize expected target host (from proxy headers or request URL)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const targetHost = (forwardedHost || hostHeader || requestUrl.host).toLowerCase();

  const sourceHeader = originHeader || refererHeader;
  if (sourceHeader) {
    try {
      const sourceUrl = new URL(sourceHeader);
      const sourceHost = sourceUrl.host.toLowerCase();

      // Check against target host (handles custom domains e.g. casthamarassery.ihrd.ac.in)
      if (sourceHost === targetHost) {
        return true;
      }

      // Also check directly against request URL host (handles direct worker or local dev)
      if (sourceHost === requestUrl.host.toLowerCase()) {
        return true;
      }

      // Source host does not match either target host or request URL host
      return false;
    } catch {
      return false;
    }
  }

  // If neither Origin nor Referer is present, allow only if Sec-Fetch-Site is 'same-origin' or 'none'
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) {
    return secFetchSite === "same-origin" || secFetchSite === "none";
  }

  // In non-browser environments or standard same-origin requests, proceed
  return true;
}

/**
 * Centralized authorization helper for API endpoints.
 * Enforces:
 * 1. Same-Origin verification on mutating HTTP methods (CSRF defense).
 * 2. Active session and authenticated administrator verification via ctx.locals.
 *
 * NOTE ON AUTHORIZATION DESIGN LIMITATION:
 * The current database schema (userTable) does not have a 'role' column.
 * Under the current design, every valid user in the users table is an administrator.
 */
export function requireAdminAuth(
  ctx: APIContext
):
  | { authorized: true; user: User; session: Session }
  | { authorized: false; response: Response } {
  // 1. Enforce Same-Origin CSRF validation for mutating methods
  if (!validateSameOrigin(ctx.request)) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Cross-Origin request blocked by CSRF policy.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  // 2. Enforce active administrator authentication
  const user = ctx.locals.user as User | null;
  const session = ctx.locals.session as Session | null;

  if (!user || !session) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required to access this administrative resource.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { authorized: true, user, session };
}
