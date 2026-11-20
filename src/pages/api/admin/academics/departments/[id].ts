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
    const rows = await withDbRetry(async (db) => {
      return await db
        .select()
        .from(departmentsTable)
        .where(eq(departmentsTable.id, id));
    }, runtimeEnv);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Department not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(rows[0]), {
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

    await withDbRetry(async (db) => {
      await db
        .update(departmentsTable)
        .set(values)
        .where(eq(departmentsTable.id, id));
    }, runtimeEnv);

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
    await withDbRetry(async (db) => {
      const existing = await db
        .select()
        .from(departmentsTable)
        .where(eq(departmentsTable.id, id));

      if (existing.length === 0) {
        throw new Error("Department not found");
      }

      await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
    }, runtimeEnv);

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
