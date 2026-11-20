import type { APIRoute } from "astro";
import { programsTable } from "@/db/schema/academics";
import { eq } from "drizzle-orm";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";

export const GET: APIRoute = async (ctx) => {
  const id = ctx.params.id;

  if (!id) {
    return new Response(
      JSON.stringify({ error: "Program ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const rows = await withDbRetry(async (db) => {
      return await db
        .select()
        .from(programsTable)
        .where(eq(programsTable.id, id));
    }, runtimeEnv);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Program not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching program:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to fetch program" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const PUT: APIRoute = async (ctx) => {
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

  const id = ctx.params.id;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Program ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const body = await ctx.request.json();
    const values = {
      name: String(body.name || ""),
      level: String(body.level || "Undergraduate"),
      duration: String(body.duration || ""),
      seats: Number(body.seats || 0),
      affiliation: String(body.affiliation || ""),
      description: body.description ? String(body.description) : null,
      eligibility: body.eligibility ? String(body.eligibility) : null,
      curriculum: Array.isArray(body.curriculum) ? body.curriculum : null,
      updatedAt: new Date(),
    } as const;

    await withDbRetry(async (db) => {
      await db.update(programsTable).set(values).where(eq(programsTable.id, id));
    }, runtimeEnv);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error updating program:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to update program" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async (ctx) => {
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

  const id = ctx.params.id;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Program ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    await withDbRetry(async (db) => {
      await db.delete(programsTable).where(eq(programsTable.id, id));
    }, runtimeEnv);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error deleting program:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to delete program" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
