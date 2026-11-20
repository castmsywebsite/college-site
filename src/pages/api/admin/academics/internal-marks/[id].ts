import type { APIRoute } from "astro";
import { internalMarksTable } from "@/db/schema/academics";
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
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        let link = formData.get("link") as string;

        if (file && file.size > 0) {
            const { uploadDocument } = await import("@/lib/supabase");
            link = await uploadDocument(file, file.name);
        }

        const runtimeEnv = (ctx.locals as any)?.runtime?.env;
        const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

        if (shouldUseSupabaseRest(runtimeEnv)) {
            const client = supabaseAdmin || supabase;
            const { error: updErr } = await client
                .from("internal_marks")
                .update({
                    title,
                    description: description || null,
                    link: link || null,
                    level,
                    program,
                    semester,
                    date: new Date(dateStr).toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);
            if (updErr) throw updErr;
        } else {
            await withDbRetry(async (db) => {
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
            }, runtimeEnv, false);
        }

        return new Response(JSON.stringify({ message: "Internal marks updated" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error updating internal marks:", error);
        return new Response(JSON.stringify({ error: error?.message || "Error updating internal marks" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
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
            return new Response(JSON.stringify({ error: "ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const runtimeEnv = (ctx.locals as any)?.runtime?.env;
        const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

        if (shouldUseSupabaseRest(runtimeEnv)) {
            const client = supabaseAdmin || supabase;
            const { error: delErr } = await client.from("internal_marks").delete().eq("id", id);
            if (delErr) throw delErr;
        } else {
            await withDbRetry(async (db) => {
                await db.delete(internalMarksTable).where(eq(internalMarksTable.id, id));
            }, runtimeEnv, false);
        }

        return new Response(JSON.stringify({ message: "Internal marks deleted" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error deleting internal marks:", error);
        return new Response(JSON.stringify({ error: error?.message || "Error deleting internal marks" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
