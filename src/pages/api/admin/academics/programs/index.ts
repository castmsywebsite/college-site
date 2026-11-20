import type { APIRoute } from "astro";
import { programsTable } from "@/db/schema/academics";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";

export const GET: APIRoute = async (ctx) => {
  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const rows = await withDbRetry(async (db) => {
      return await db.select().from(programsTable);
    }, runtimeEnv);

    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching programs:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to fetch programs" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  if (!validateSameOrigin(ctx.request)) {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Cross-Origin request blocked" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const user = ctx.locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Admin authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const body = await ctx.request.json();
    const id = crypto.randomUUID();
    const values = {
      id,
      name: String(body.name || ""),
      level: String(body.level || "Undergraduate"),
      duration: String(body.duration || ""),
      seats: Number(body.seats || 0),
      affiliation: String(body.affiliation || ""),
      description: body.description ? String(body.description) : null,
      eligibility: body.eligibility ? String(body.eligibility) : null,
      curriculum: Array.isArray(body.curriculum) ? body.curriculum : null,
    } as const;

    await withDbRetry(async (db) => {
      await db.insert(programsTable).values(values);
    }, runtimeEnv, false);

    return new Response(JSON.stringify({ id, success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating program:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to create program" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
