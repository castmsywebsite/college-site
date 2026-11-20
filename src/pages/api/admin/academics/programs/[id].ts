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
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    let program: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client.from("programs").select("*").eq("id", id).limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        program = {
          id: row.id,
          name: row.name,
          level: row.level,
          duration: row.duration,
          seats: row.seats,
          affiliation: row.affiliation,
          description: row.description,
          eligibility: row.eligibility,
          curriculum: row.curriculum,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } else {
      const rows = await withDbRetry(async (db) => {
        return await db
          .select()
          .from(programsTable)
          .where(eq(programsTable.id, id));
      }, runtimeEnv);
      if (rows.length > 0) program = rows[0];
    }

    if (!program) {
      return new Response(
        JSON.stringify({ error: "Program not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(program), {
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

    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error: updErr } = await client
        .from("programs")
        .update({
          name: values.name,
          level: values.level,
          duration: values.duration,
          seats: values.seats,
          affiliation: values.affiliation,
          description: values.description,
          eligibility: values.eligibility,
          curriculum: values.curriculum,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updErr) throw updErr;
    } else {
      await withDbRetry(async (db) => {
        await db.update(programsTable).set(values).where(eq(programsTable.id, id));
      }, runtimeEnv, false);
    }

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
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error: delErr } = await client.from("programs").delete().eq("id", id);
      if (delErr) throw delErr;
    } else {
      await withDbRetry(async (db) => {
        await db.delete(programsTable).where(eq(programsTable.id, id));
      }, runtimeEnv, false);
    }

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
