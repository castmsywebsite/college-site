import type { APIContext } from "astro";
import type { User, Session } from "./auth";

export interface AuthenticatedAdminContext {
  user: User;
  session: Session;
}

/**
 * Validates that state-changing requests (POST, PUT, PATCH, DELETE)
 * originate from the same origin to protect against Cross-Site Request Forgery (CSRF).
 */
export function validateSameOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  // Safe HTTP methods do not mutate state
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const originHeader = request.headers.get("origin");
  const requestUrl = new URL(request.url);

  if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      return originUrl.origin === requestUrl.origin;
    } catch {
      return false;
    }
  }

  // Fallback to Referer header if Origin is not supplied (e.g. certain browser form navigations)
  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      return refererUrl.origin === requestUrl.origin;
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

