import type { APIRoute } from "astro";
import { eq, asc } from "drizzle-orm";
import { staffTable } from "@/db/schema/administration";
import { departmentsTable } from "@/db/schema/academics";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";
import {
  getCanonicalDepartment,
  validateStaffCategoryAndDepartment,
  resolveDepartmentId,
} from "@/lib/departments";

export const GET: APIRoute = async (ctx) => {
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
        .orderBy(asc(staffTable.displayOrder));
    }, runtimeEnv);

    const result = rows.map((row) => {
      let canonicalDept = getCanonicalDepartment(row.departmentName);
      if (row.staff.category === "faculty" && !canonicalDept) {
        canonicalDept = "Others";
      }

      return {
        ...row.staff,
        departmentName: row.departmentName ? row.departmentName.trim() : null,
        department: canonicalDept,
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Failed to fetch staff list:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error?.message || "Failed to fetch staff list",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async (ctx) => {
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

    const id = crypto.randomUUID();

    await withDbRetry(async (db) => {
      // Resolve department ID from database
      let resolvedDepartmentId: string | null = null;
      if (validation.canonicalDept) {
        resolvedDepartmentId = await resolveDepartmentId(db, validation.canonicalDept);
      }

      const values = {
        id,
        name: String(body.name || ""),
        position: String(body.position || ""),
        qualification: body.qualification ? String(body.qualification) : null,
        experience: body.experience ? String(body.experience) : null,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        image: body.image ? String(body.image) : null,
        departmentId: resolvedDepartmentId,
        displayOrder:
          typeof body.displayOrder === "number" ? body.displayOrder : 99,
        category,
        achievements: Array.isArray(body.achievements) ? body.achievements : null,
      } as const;

      await db.insert(staffTable).values(values);
    }, runtimeEnv, false);

    return new Response(JSON.stringify({ id, success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Failed to create staff member:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to create staff member" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
