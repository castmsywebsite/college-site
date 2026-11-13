
import type { APIRoute } from "astro";
import { db } from "@/db";
import { internalMarksTable } from "@/db/schema/academics";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api-auth";

export const PUT: APIRoute = async (ctx) => {
    const auth = requireAdminAuth(ctx);
    if (!auth.authorized) {
        return auth.response;
    }

    const { params, request } = ctx;
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
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
            });
        }

        let link = formData.get("link") as string;

        if (file && file.size > 0) {
            const { uploadDocument } = await import("@/lib/supabase");
            link = await uploadDocument(file, file.name);
        }

        await db
            .update(internalMarksTable)
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
            .where(eq(internalMarksTable.id, id));

        return new Response(JSON.stringify({ message: "Internal marks updated" }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error updating internal marks:", error);
        return new Response(JSON.stringify({ message: "Error updating internal marks" }), {
            status: 500,
        });
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
            return new Response(JSON.stringify({ message: "ID is required" }), {
                status: 400,
            });
        }

        await db.delete(internalMarksTable).where(eq(internalMarksTable.id, id));

        return new Response(JSON.stringify({ message: "Internal marks deleted" }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error deleting internal marks:", error);
        return new Response(JSON.stringify({ message: "Error deleting internal marks" }), {
            status: 500,
        });
    }
};
