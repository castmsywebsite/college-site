import type { APIRoute } from "astro";
import { db } from "@/db";
import { announcementsTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAdminAuth } from "@/lib/api-auth";

export const GET: APIRoute = async () => {
    try {
        const announcements = await db
            .select()
            .from(announcementsTable)
            .orderBy(desc(announcementsTable.createdAt));

        return new Response(JSON.stringify(announcements), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch announcements" }), {
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

        const newAnnouncement = await db
            .insert(announcementsTable)
            .values({
                id: uuidv4(),
                text,
                highlight,
                active: active !== undefined ? active : true,
            })
            .returning();

        return new Response(JSON.stringify(newAnnouncement[0]), {
            status: 201,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to create announcement" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};
