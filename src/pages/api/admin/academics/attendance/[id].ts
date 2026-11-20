import type { APIRoute } from "astro";
import { attendanceTable } from "@/db/schema/academics";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const PUT: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  const { params, request } = ctx;
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const level = formData.get("level") as string;
    const program = formData.get("program") as string;
    const semester = formData.get("semester") as string;
    const dateStr = formData.get("date") as string;
    const file = formData.get("file") as File;

    if (!title || !level || !program || !semester || !dateStr) {
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

    const runtimeEnv = (ctx.locals as any)?.runtime?.env;

    await withDbRetry(async (db) => {
      await db
        .update(attendanceTable)
        .set({
          title,
          description,
          link,
          level,
          program,
          semester,
          date: new Date(dateStr),
          updatedAt: new Date(),
        })
        .where(eq(attendanceTable.id, id));
    }, runtimeEnv, false);

    return new Response(JSON.stringify({ message: "Attendance updated" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error updating attendance:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error updating attendance" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  const { params } = ctx;
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    await withDbRetry(async (db) => {
      await db.delete(attendanceTable).where(eq(attendanceTable.id, id));
    }, runtimeEnv, false);

    return new Response(JSON.stringify({ message: "Attendance deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error deleting attendance:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error deleting attendance" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
