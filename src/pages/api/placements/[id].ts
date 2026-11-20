import type { APIRoute } from "astro";
import { placementsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const PUT: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = ctx.params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Placement ID is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await ctx.request.json();
    const studentName = (body.studentName || body.name || "").trim();
    const companyName = (body.companyName || body.company || "").trim();
    const position = (body.position || "").trim();
    const graduatedYear = (body.graduatedYear || body.year || "").trim();
    const imageUrl = (body.imageUrl || body.image || "").trim();
    const displayOrder = typeof body.displayOrder === "number" ? body.displayOrder : 99;

    if (!studentName || !companyName || !graduatedYear) {
      return new Response(
        JSON.stringify({ error: "Student Name, Company Name, and Graduated Year are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    let updatedRecord: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("placements")
        .update({
          student_name: studentName,
          company_name: companyName,
          position: position || null,
          graduated_year: graduatedYear,
          image_url: imageUrl || null,
          display_order: displayOrder,
          updated_at: now.toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        updatedRecord = {
          id: row.id,
          studentName: row.student_name,
          companyName: row.company_name,
          position: row.position || "",
          graduatedYear: row.graduated_year,
          imageUrl: row.image_url || "",
          displayOrder: row.display_order,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } else {
      try {
        const rows = await withDbRetry(async (db) => {
          return await db
            .update(placementsTable)
            .set({
              studentName,
              companyName,
              position: position || null,
              graduatedYear,
              imageUrl: imageUrl || null,
              displayOrder,
              updatedAt: now,
            })
            .where(eq(placementsTable.id, id))
            .returning();
        }, (ctx.locals as any)?.db || runtimeEnv);

        if (rows && rows.length > 0) {
          const row = rows[0];
          updatedRecord = {
            id: row.id,
            studentName: row.studentName,
            companyName: row.companyName,
            position: row.position || "",
            graduatedYear: row.graduatedYear,
            imageUrl: row.imageUrl || "",
            displayOrder: row.displayOrder,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          };
        }
      } catch (dbError: any) {
        console.warn("Placements Drizzle update failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from("placements")
          .update({
            student_name: studentName,
            company_name: companyName,
            position: position || null,
            graduated_year: graduatedYear,
            image_url: imageUrl || null,
            display_order: displayOrder,
            updated_at: now.toISOString(),
          })
          .eq("id", id)
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const row = data[0];
          updatedRecord = {
            id: row.id,
            studentName: row.student_name,
            companyName: row.company_name,
            position: row.position || "",
            graduatedYear: row.graduated_year,
            imageUrl: row.image_url || "",
            displayOrder: row.display_order,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        }
      }
    }

    return new Response(JSON.stringify(updatedRecord || { id, studentName, companyName, graduatedYear }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error updating placement:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update placement", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = ctx.params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Placement ID is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error } = await client.from("placements").delete().eq("id", id);
      if (error) throw error;
    } else {
      try {
        await withDbRetry(async (db) => {
          return await db.delete(placementsTable).where(eq(placementsTable.id, id));
        }, (ctx.locals as any)?.db || runtimeEnv);
      } catch (dbError: any) {
        console.warn("Placements Drizzle delete failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { error } = await client.from("placements").delete().eq("id", id);
        if (error) throw error;
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Placement deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error deleting placement:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete placement", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
