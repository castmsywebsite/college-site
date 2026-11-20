import type { APIRoute } from "astro";
import { departmentsTable } from "@/db/schema/academics";
import { eq } from "drizzle-orm";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";

export const GET: APIRoute = async (ctx) => {
  const id = ctx.params.id;

  if (!id) {
    return new Response(
      JSON.stringify({ error: "Department ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    let department: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client.from("departments").select("*").eq("id", id).limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        department = {
          id: row.id,
          name: row.name,
          hod: row.hod,
          faculty: row.faculty,
          labs: row.labs,
          description: row.description,
          specializations: row.specializations,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } else {
      const rows = await withDbRetry(async (db) => {
        return await db
          .select()
          .from(departmentsTable)
          .where(eq(departmentsTable.id, id));
      }, runtimeEnv);
      if (rows.length > 0) department = rows[0];
    }

    if (!department) {
      return new Response(
        JSON.stringify({ error: "Department not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(department), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching department:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to fetch department" }),
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
      JSON.stringify({ error: "Department ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const body = await ctx.request.json();

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
      name: String(body.name),
      hod: String(body.hod),
      faculty: Number(body.faculty),
      labs: Number(body.labs),
      description: body.description ? String(body.description) : null,
      specializations:
        Array.isArray(body.specializations) && body.specializations.length > 0
          ? body.specializations.filter((spec: string) => spec && spec.trim())
          : null,
      updatedAt: new Date(),
    } as const;

    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error: updErr } = await client
        .from("departments")
        .update({
          name: values.name,
          hod: values.hod,
          faculty: values.faculty,
          labs: values.labs,
          description: values.description,
          specializations: values.specializations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updErr) throw updErr;
    } else {
      await withDbRetry(async (db) => {
        await db
          .update(departmentsTable)
          .set(values)
          .where(eq(departmentsTable.id, id));
      }, runtimeEnv, false);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error updating department:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to update department" }),
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
      JSON.stringify({ error: "Department ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error: delErr } = await client.from("departments").delete().eq("id", id);
      if (delErr) throw delErr;
    } else {
      await withDbRetry(async (db) => {
        const existing = await db
          .select()
          .from(departmentsTable)
          .where(eq(departmentsTable.id, id));

        if (existing.length === 0) {
          throw new Error("Department not found");
        }

        await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
      }, runtimeEnv, false);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error deleting department:", error);
    const status = error.message === "Department not found" ? 404 : 500;
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to delete department" }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
};
