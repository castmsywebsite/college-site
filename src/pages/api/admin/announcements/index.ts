import type { APIRoute } from "astro";
import { announcementsTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const GET: APIRoute = async (ctx) => {
    try {
        const runtimeEnv = (ctx.locals as any)?.runtime?.env;
        const announcements = await withDbRetry(async (db) => {
            return await db
                .select()
                .from(announcementsTable)
                .orderBy(desc(announcementsTable.createdAt));
        }, runtimeEnv);

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
