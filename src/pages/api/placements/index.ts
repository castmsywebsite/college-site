import type { APIRoute } from "astro";
import { placementsTable } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const GET: APIRoute = async (ctx) => {
  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    let placements: any[] = [];

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("placements")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      placements = (data || []).map((row: any) => ({
        id: row.id,
        studentName: row.student_name,
        companyName: row.company_name,
        position: row.position || "",
        graduatedYear: row.graduated_year,
        imageUrl: row.image_url || "",
        displayOrder: row.display_order ?? 99,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } else {
      try {
        const rows = await withDbRetry(async (db) => {
          return await db
            .select()
            .from(placementsTable)
            .orderBy(asc(placementsTable.displayOrder), desc(placementsTable.createdAt));
        }, (ctx.locals as any)?.db || runtimeEnv);

        placements = (rows || []).map((row: any) => ({
          id: row.id,
          studentName: row.studentName,
          companyName: row.companyName,
          position: row.position || "",
          graduatedYear: row.graduatedYear,
          imageUrl: row.imageUrl || "",
          displayOrder: row.displayOrder ?? 99,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      } catch (dbError: any) {
        console.warn("Placements Drizzle query failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from("placements")
          .select("*")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        placements = (data || []).map((row: any) => ({
          id: row.id,
          studentName: row.student_name,
          companyName: row.company_name,
          position: row.position || "",
          graduatedYear: row.graduated_year,
          imageUrl: row.image_url || "",
          displayOrder: row.display_order ?? 99,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    }

    return new Response(JSON.stringify(placements), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: any) {
    console.error("Error fetching placements:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch placements", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
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

    const id = uuidv4();
    const now = new Date();
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    let createdRecord: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("placements")
        .insert({
          id,
          student_name: studentName,
          company_name: companyName,
          position: position || null,
          graduated_year: graduatedYear,
          image_url: imageUrl || null,
          display_order: displayOrder,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        createdRecord = {
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
            .insert(placementsTable)
            .values({
              id,
              studentName,
              companyName,
              position: position || null,
              graduatedYear,
              imageUrl: imageUrl || null,
              displayOrder,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
        }, (ctx.locals as any)?.db || runtimeEnv);

        if (rows && rows.length > 0) {
          const row = rows[0];
          createdRecord = {
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
        console.warn("Placements Drizzle insert failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from("placements")
          .insert({
            id,
            student_name: studentName,
            company_name: companyName,
            position: position || null,
            graduated_year: graduatedYear,
            image_url: imageUrl || null,
            display_order: displayOrder,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const row = data[0];
          createdRecord = {
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

    return new Response(JSON.stringify(createdRecord || { id, studentName, companyName, graduatedYear }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating placement:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create placement", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
