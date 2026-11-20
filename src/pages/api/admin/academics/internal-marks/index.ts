import type { APIRoute } from "astro";
import { internalMarksTable } from "@/db/schema/academics";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const GET: APIRoute = async (ctx) => {
  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const marks = await withDbRetry(async (db) => {
      return await db
        .select()
        .from(internalMarksTable)
        .orderBy(desc(internalMarksTable.date));
    }, runtimeEnv);

    return new Response(JSON.stringify(marks), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching internal marks:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error fetching internal marks" }),
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

    await withDbRetry(async (db) => {
      await db
        .insert(internalMarksTable)
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
    }, runtimeEnv);

    return new Response(
      JSON.stringify({ message: "Internal marks created", id }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating internal marks:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error creating internal marks" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
