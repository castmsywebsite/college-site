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
import { shouldUseSupabaseRest, supabaseAdmin, supabase } from "@/lib/supabase";

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
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    let row: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("staff")
        .select("*, departments(name)")
        .eq("id", id)
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const s = data[0];
        row = {
          staff: {
            id: s.id,
            name: s.name,
            position: s.position,
            designation: s.position,
            qualification: s.qualification,
            experience: s.experience,
            email: s.email,
            phone: s.phone,
            image: s.image,
            photoUrl: s.image,
            departmentId: s.department_id,
            displayOrder: s.display_order,
            category: s.category,
            achievements: s.achievements,
            roles: s.achievements,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          },
          departmentName: s.departments?.name || null,
        };
      }
    } else {
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
      if (rows && rows.length > 0) row = rows[0];
    }

    if (!row) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      let resolvedDepartmentId: string | null = null;
      if (validation.canonicalDept) {
        resolvedDepartmentId = await resolveDepartmentId(client, validation.canonicalDept);
      }

      const values = {
        name: String(body.name || ""),
        position: String(body.position || body.designation || ""),
        qualification: body.qualification ? String(body.qualification) : null,
        experience: body.experience ? String(body.experience) : null,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        image: body.image || body.photoUrl ? String(body.image || body.photoUrl) : null,
        department_id: resolvedDepartmentId,
        category,
        achievements: Array.isArray(body.achievements)
          ? body.achievements
          : Array.isArray(body.roles)
            ? body.roles
            : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updErr } = await client.from("staff").update(values).eq("id", id);
      if (updErr) throw updErr;
    } else {
      await withDbRetry(async (db) => {
        // Resolve department ID from database
        let resolvedDepartmentId: string | null = null;
        if (validation.canonicalDept) {
          resolvedDepartmentId = await resolveDepartmentId(db, validation.canonicalDept);
        }

        const values = {
          name: String(body.name || ""),
          position: String(body.position || body.designation || ""),
          qualification: body.qualification ? String(body.qualification) : null,
          experience: body.experience ? String(body.experience) : null,
          email: body.email ? String(body.email) : null,
          phone: body.phone ? String(body.phone) : null,
          image: body.image || body.photoUrl ? String(body.image || body.photoUrl) : null,
          departmentId: resolvedDepartmentId,
          category,
          achievements: Array.isArray(body.achievements) ? body.achievements : null,
          updatedAt: new Date(),
        } as const;

        await db.update(staffTable).set(values).where(eq(staffTable.id, id));
      }, runtimeEnv, false);
    }

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
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error: delErr } = await client.from("staff").delete().eq("id", id);
      if (delErr) throw delErr;
    } else {
      await withDbRetry(async (db) => {
        await db.delete(staffTable).where(eq(staffTable.id, id));
      }, runtimeEnv, false);
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error("Failed to delete staff member:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to delete staff member" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
