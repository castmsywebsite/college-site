import type { APIRoute } from "astro";
import { departmentsTable } from "@/db/schema/academics";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";

export const GET: APIRoute = async (ctx) => {
  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    let rows: any[] = [];
    try {
      rows = await withDbRetry(async (db) => {
        return await db.select().from(departmentsTable);
      }, (ctx.locals as any)?.db || runtimeEnv);
    } catch (dbError: any) {
      console.warn("Departments Drizzle query failed, falling back to Supabase REST:", dbError?.message);
      const { supabaseAdmin, supabase } = await import("@/lib/supabase");
      const client = supabaseAdmin || supabase;
      const { data, error } = await client.from("departments").select("*");
      if (error) throw error;
      rows = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to fetch departments" }),
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

    // Validate required fields
    if (
      !body.name ||
      !body.hod ||
      body.faculty === undefined ||
      body.labs === undefined
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const values = {
      id,
      name: String(body.name),
      hod: String(body.hod),
      faculty: Number(body.faculty),
      labs: Number(body.labs),
      description: body.description ? String(body.description) : null,
      specializations:
        Array.isArray(body.specializations) && body.specializations.length > 0
          ? body.specializations.filter((spec: string) => spec && spec.trim())
          : null,
    } as const;

    await withDbRetry(async (db) => {
      await db.insert(departmentsTable).values(values);
    }, runtimeEnv, false);

    return new Response(JSON.stringify({ id, success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating department:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to create department" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
