import type { APIRoute } from "astro";
import { Auth } from "@/lib/auth";
import { validateSameOrigin } from "@/lib/api-auth";

export const POST: APIRoute = async (ctx) => {
  // 1. Enforce same-origin CSRF validation
  if (!validateSameOrigin(ctx.request)) {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Cross-Origin logout blocked" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const { db } = ctx.locals;
  const session = ctx.locals.session;

  if (session && db) {
    const auth = Auth.getInstance(db);
    await auth.invalidateSession(session.id);
    const clearCookie = auth.clearSessionCookie();
    ctx.cookies.set(clearCookie.name, clearCookie.value, clearCookie.attributes);
  } else if (db) {
    const auth = Auth.getInstance(db);
    const clearCookie = auth.clearSessionCookie();
    ctx.cookies.set(clearCookie.name, clearCookie.value, clearCookie.attributes);
  }

  // Check if caller requests JSON or standard browser form redirect
  const acceptHeader = ctx.request.headers.get("accept") || "";
  if (acceptHeader.includes("application/json")) {
    return new Response(
      JSON.stringify({ success: true, message: "Logged out successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return ctx.redirect("/admin/admin-login-user-access", 303);
};

