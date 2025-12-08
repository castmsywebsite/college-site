import type { APIRoute } from "astro";
import { db } from "@/db";
import { internalMarksTable } from "@/db/schema/academics";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const GET: APIRoute = async () => {
  try {
    //FIXED: db.select instead of db().select
    const marks = await db
      .select()
      .from(internalMarksTable)
      .orderBy(desc(internalMarksTable.date));
    return new Response(JSON.stringify(marks), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error fetching internal marks" }),
      { status: 500 }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
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
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    let link = formData.get("link") as string;

    if (file && file.size > 0) {
      const { uploadDocument } = await import("@/lib/supabase");
      link = await uploadDocument(file, file.name);
    }

    const id = uuidv4();

    //FIXED: db.insert instead of db().insert
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

    return new Response(
      JSON.stringify({ message: "Internal marks created", id }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating internal marks:", error);
    return new Response(
      JSON.stringify({ message: "Error creating internal marks" }),
      { status: 500 }
    );
  }
};