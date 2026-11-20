import type { APIRoute } from "astro";
import { announcementsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const PUT: APIRoute = async (ctx) => {
    const auth = requireAdminAuth(ctx);
    if (!auth.authorized) {
        return auth.response;
    }

    const { params, request } = ctx;
    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: "ID is required" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    try {
        const data = await request.json();
        const { text, highlight, active } = data;

        const runtimeEnv = (ctx.locals as any)?.runtime?.env;
        const updatedAnnouncement = await withDbRetry(async (db) => {
            return await db
                .update(announcementsTable)
                .set({
                    text,
                    highlight,
                    active,
                    updatedAt: new Date(),
                })
                .where(eq(announcementsTable.id, id))
                .returning();
        }, runtimeEnv, false);

        if (updatedAnnouncement.length === 0) {
            return new Response(JSON.stringify({ error: "Announcement not found" }), {
                status: 404,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }

        return new Response(JSON.stringify(updatedAnnouncement[0]), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Failed to update announcement:", error);
        return new Response(JSON.stringify({ error: error?.message || "Failed to update announcement" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};

export const DELETE: APIRoute = async (ctx) => {
    const auth = requireAdminAuth(ctx);
    if (!auth.authorized) {
        return auth.response;
    }

    const { params } = ctx;
    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: "ID is required" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    try {
        const runtimeEnv = (ctx.locals as any)?.runtime?.env;
        const deletedAnnouncement = await withDbRetry(async (db) => {
            return await db
                .delete(announcementsTable)
                .where(eq(announcementsTable.id, id))
                .returning();
        }, runtimeEnv, false);

        if (deletedAnnouncement.length === 0) {
            return new Response(JSON.stringify({ error: "Announcement not found" }), {
                status: 404,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }

        return new Response(JSON.stringify({ message: "Announcement deleted successfully" }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Failed to delete announcement:", error);
        return new Response(JSON.stringify({ error: error?.message || "Failed to delete announcement" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};
