import type { APIRoute } from "astro";
import { attendanceTable } from "@/db/schema/academics";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const GET: APIRoute = async (ctx) => {
  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    let attendance: any[] = [];

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("attendance")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      attendance = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        link: row.link,
        level: row.level,
        program: row.program,
        batch: row.batch,
        semester: row.semester,
        date: row.date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } else {
      try {
        attendance = await withDbRetry(async (db) => {
          return await db
            .select()
            .from(attendanceTable)
            .orderBy(desc(attendanceTable.date));
        }, (ctx.locals as any)?.db || runtimeEnv);
      } catch (dbError: any) {
        console.warn("Attendance Drizzle query failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from("attendance")
          .select("*")
          .order("date", { ascending: false });
        if (error) throw error;
        attendance = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          link: row.link,
          level: row.level,
          program: row.program,
          batch: row.batch,
          semester: row.semester,
          date: row.date,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    }

    return new Response(JSON.stringify(attendance), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error fetching attendance" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  const { request } = ctx;
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const level = formData.get("level") as string;
    const program = formData.get("program") as string;
    const batch = formData.get("batch") as string;
    const semester = formData.get("semester") as string;
    const dateStr = formData.get("date") as string;
    const file = formData.get("file") as File;

    if (!title || !level || !program || !batch || !semester || !dateStr) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let link = formData.get("link") as string;

    if (file && file.size > 0) {
      const { uploadDocument } = await import("@/lib/supabase");
      link = await uploadDocument(file, file.name);
    }

    const id = uuidv4();
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;

    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error: insErr } = await client.from("attendance").insert({
        id,
        title,
        description: description || null,
        link: link || null,
        level,
        program,
        batch,
        semester,
        date: new Date(dateStr).toISOString(),
      });
      if (insErr) throw insErr;
    } else {
      await withDbRetry(async (db) => {
        await db
          .insert(attendanceTable)
          .values({
            id,
            title,
            description,
            link,
            level,
            program,
            batch,
            semester,
            date: new Date(dateStr),
          });
      }, runtimeEnv, false);
    }

    return new Response(JSON.stringify({ message: "Attendance created", id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating attendance:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error creating attendance" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
