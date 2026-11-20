import type { APIRoute } from "astro";
import { staffTable } from "@/db/schema/administration";
import { departmentsTable } from "@/db/schema/academics";
import { eq } from "drizzle-orm";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";
import {
  getCanonicalDepartment,
  validateStaffCategoryAndDepartment,
  resolveDepartmentId,
} from "@/lib/departments";

export const GET: APIRoute = async (ctx) => {
  const user = ctx.locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Admin authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const id = ctx.params.id!;
  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const rows = await withDbRetry(async (db) => {
      return await db
        .select({
          staff: staffTable,
          departmentName: departmentsTable.name,
        })
        .from(staffTable)
        .leftJoin(
          departmentsTable,
          eq(staffTable.departmentId, departmentsTable.id)
        )
        .where(eq(staffTable.id, id));
    }, runtimeEnv);

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const row = rows[0];
    let canonicalDept = getCanonicalDepartment(row.departmentName);
    if (row.staff.category === "faculty" && !canonicalDept) {
      canonicalDept = "Others";
    }

    return new Response(
      JSON.stringify({
        ...row.staff,
        departmentName: row.departmentName ? row.departmentName.trim() : null,
        department: canonicalDept,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch staff record:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error?.message || "Failed to fetch staff" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const PUT: APIRoute = async (ctx) => {
  if (!validateSameOrigin(ctx.request)) {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Cross-Origin request blocked by CSRF policy" }),
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
    const id = ctx.params.id!;
    const body = await ctx.request.json();
    const category = String(body.category || "faculty").toLowerCase();
    const departmentInput = body.department ?? body.departmentName ?? null;

    // Validate category and department combination
    const validation = validateStaffCategoryAndDepartment(category, departmentInput);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await withDbRetry(async (db) => {
      // Resolve department ID from database
      let resolvedDepartmentId: string | null = null;
      if (validation.canonicalDept) {
        resolvedDepartmentId = await resolveDepartmentId(db, validation.canonicalDept);
      }

      const values = {
        name: String(body.name || ""),
        position: String(body.position || ""),
        qualification: body.qualification ? String(body.qualification) : null,
        experience: body.experience ? String(body.experience) : null,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        image: body.image ? String(body.image) : null,
        departmentId: resolvedDepartmentId,
        category,
        achievements: Array.isArray(body.achievements) ? body.achievements : null,
        updatedAt: new Date(),
      } as const;

      await db.update(staffTable).set(values).where(eq(staffTable.id, id));
    }, runtimeEnv);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Failed to update staff member:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to update staff member" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async (ctx) => {
  if (!validateSameOrigin(ctx.request)) {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Cross-Origin request blocked by CSRF policy" }),
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

  const id = ctx.params.id!;
  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    await withDbRetry(async (db) => {
      await db.delete(staffTable).where(eq(staffTable.id, id));
    }, runtimeEnv);

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error("Failed to delete staff member:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to delete staff member" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
