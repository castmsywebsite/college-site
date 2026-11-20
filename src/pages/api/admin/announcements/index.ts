import type { APIRoute } from "astro";
import { announcementsTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const GET: APIRoute = async (ctx) => {
    try {
        const runtimeEnv = (ctx.locals as any)?.runtime?.env;
        let announcements: any[] = [];
        try {
            announcements = await withDbRetry(async (db) => {
                return await db
                    .select()
                    .from(announcementsTable)
                    .orderBy(desc(announcementsTable.createdAt));
            }, (ctx.locals as any)?.db || runtimeEnv);
        } catch (dbError: any) {
            console.warn("Announcements Drizzle query failed, falling back to Supabase REST:", dbError?.message);
            const { supabaseAdmin, supabase } = await import("@/lib/supabase");
            const client = supabaseAdmin || supabase;
            const { data, error } = await client
                .from("announcements")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            announcements = (data || []).map((row: any) => ({
                id: row.id,
                text: row.text,
                highlight: row.highlight,
                active: row.active,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));
        }

        return new Response(JSON.stringify(announcements), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Failed to fetch announcements:", error);
        return new Response(JSON.stringify({ error: error?.message || "Failed to fetch announcements" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};

export const POST: APIRoute = async (ctx) => {
    const auth = requireAdminAuth(ctx);
    if (!auth.authorized) {
        return auth.response;
    }

    const { request } = ctx;
    try {
        const data = await request.json();
        const { text, highlight, active } = data;

        if (!text) {
            return new Response(JSON.stringify({ error: "Text is required" }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }

        const runtimeEnv = (ctx.locals as any)?.runtime?.env;
        const newAnnouncement = await withDbRetry(async (db) => {
            return await db
                .insert(announcementsTable)
                .values({
                    id: uuidv4(),
                    text,
                    highlight,
                    active: active !== undefined ? active : true,
                })
                .returning();
        }, runtimeEnv, false);

        return new Response(JSON.stringify(newAnnouncement[0]), {
            status: 201,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Failed to create announcement:", error);
        return new Response(JSON.stringify({ error: error?.message || "Failed to create announcement" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};
