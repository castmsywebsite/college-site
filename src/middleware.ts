import { defineMiddleware } from "astro:middleware";
import { Auth } from "./lib/auth";
import { getDb, createRequestDb, dbAsyncLocalStorage, type RequestDatabaseContext } from "./db";

export const onRequest = defineMiddleware(async (context, next) => {
  const runtimeEnv = (context.locals as any)?.runtime?.env;
  const cfCtx = (context.locals as any)?.runtime?.ctx;

  let reqContext: RequestDatabaseContext | null = null;
  try {
    reqContext = createRequestDb(runtimeEnv);
  } catch (err) {
    console.warn("Could not create request-scoped DB context:", err);
  }

  const runWithContext = async (activeContext: RequestDatabaseContext | null) => {
    try {
      if (activeContext) {
        context.locals.db = activeContext.db as any;
        context.locals.auth = Auth.getInstance(context.locals.db as any);
        const auth = context.locals.auth;
        auth.updateDb(context.locals.db as any);

        const sessionId = context.cookies.get(Auth.sessionCookieName)?.value;
        if (!sessionId) {
          context.locals.user = null;
          context.locals.session = null;
        } else {
          try {
            const { session, user } = await auth.validateSession(sessionId);

            // Set cookies BEFORE calling next()
            if (session) {
              const sessionCookie = auth.createSessionCookie(session.id);
              context.cookies.set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes
              );
            } else {
              const sessionCookie = auth.clearSessionCookie();
              context.cookies.set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes
              );
            }

            context.locals.session = session;
            context.locals.user = user;
          } catch (sessionError) {
            console.error("Middleware session validation error:", sessionError);
            context.locals.user = null;
            context.locals.session = null;
          }
        }
      } else {
        context.locals.db = getDb(runtimeEnv) as any;
        context.locals.user = null;
        context.locals.session = null;
      }

      const pathname = context.url.pathname;
      const isProtectedAdminRoute =
        (pathname === "/admin" || pathname.startsWith("/admin/")) &&
        pathname !== "/admin/admin-login-user-access";

      // Centralized redirect for unauthenticated protected Admin requests
      if (isProtectedAdminRoute && !context.locals.session) {
        const redirectResponse = context.redirect("/admin/admin-login-user-access", 302);
        redirectResponse.headers.set(
          "Cache-Control",
          "private, no-store, no-cache, must-revalidate, max-age=0"
        );
        redirectResponse.headers.set("Pragma", "no-cache");
        redirectResponse.headers.set("Expires", "0");
        redirectResponse.headers.set("X-Content-Type-Options", "nosniff");
        redirectResponse.headers.set("X-Frame-Options", "SAMEORIGIN");
        redirectResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        return redirectResponse;
      }

      const response = await next();

      // SEC-HIGH Base Security Headers (safe, non-breaking baseline)
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "SAMEORIGIN");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
      );

      // Comprehensive Cache-Control for all Admin HTML & API responses
      if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin")) {
        response.headers.set(
          "Cache-Control",
          "private, no-store, no-cache, must-revalidate, max-age=0"
        );
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
      }

      return response;
    } finally {
      // In Cloudflare Workers, cleanly terminate this request's Postgres client in waitUntil
      if (activeContext && cfCtx && typeof cfCtx.waitUntil === "function") {
        cfCtx.waitUntil(activeContext.client.end({ timeout: 1 }).catch(() => {}));
      }
    }
  };

  if (reqContext) {
    return await dbAsyncLocalStorage.run(reqContext, () => runWithContext(reqContext));
  } else {
    return await runWithContext(null);
  }
});
