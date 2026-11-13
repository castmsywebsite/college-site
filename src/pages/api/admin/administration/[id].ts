import type { APIRoute } from "astro";
import { staffTable } from "@/db/schema/administration";
import { departmentsTable } from "@/db/schema/academics";
import { eq } from "drizzle-orm";
import {
  getCanonicalDepartment,
  validateStaffCategoryAndDepartment,
  resolveDepartmentId,
} from "@/lib/departments";

export const GET: APIRoute = async (ctx) => {
  const db = ctx.locals.db;
  const user = ctx.locals.user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const id = ctx.params.id!;
  const rows = await db
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

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
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
};

export const PUT: APIRoute = async (ctx) => {
  const db = ctx.locals.db;
  const user = ctx.locals.user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
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
  const db = ctx.locals.db;
  const user = ctx.locals.user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const id = ctx.params.id!;
  await db.delete(staffTable).where(eq(staffTable.id, id));
  return new Response(null, { status: 204 });
};
