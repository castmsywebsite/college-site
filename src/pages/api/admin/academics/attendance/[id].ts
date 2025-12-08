import type { APIRoute } from "astro";
import { db } from "@/db";
import { attendanceTable } from "@/db/schema/academics";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ message: "ID is required" }), {
        status: 400,
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
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    let link = formData.get("link") as string;

    if (file && file.size > 0) {
      const { uploadDocument } = await import("@/lib/supabase");
      link = await uploadDocument(file, file.name);
    }

    //FIXED: db.update instead of db().update
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

    return new Response(JSON.stringify({ message: "Attendance updated" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return new Response(
      JSON.stringify({ message: "Error updating attendance" }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ message: "ID is required" }), {
        status: 400,
      });
    }

    //FIXED: db.delete instead of db().delete
    await db.delete(attendanceTable).where(eq(attendanceTable.id, id));

    return new Response(JSON.stringify({ message: "Attendance deleted" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return new Response(
      JSON.stringify({ message: "Error deleting attendance" }),
      { status: 500 }
    );
  }
};