import type { APIRoute } from "astro";
import { db } from "@/db";
import { announcementsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api-auth";

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

        const updatedAnnouncement = await db
            .update(announcementsTable)
            .set({
                text,
                highlight,
                active,
                updatedAt: new Date(),
            })
            .where(eq(announcementsTable.id, id))
            .returning();

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
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to update announcement" }), {
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
        const deletedAnnouncement = await db
            .delete(announcementsTable)
            .where(eq(announcementsTable.id, id))
            .returning();

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
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to delete announcement" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};
