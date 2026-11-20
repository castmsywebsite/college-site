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
        const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
        let resultAnnouncement: any = null;

        if (shouldUseSupabaseRest(runtimeEnv)) {
            const client = supabaseAdmin || supabase;
            const { data, error: updErr } = await client
                .from("announcements")
                .update({
                    text,
                    highlight: highlight || null,
                    active,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id)
                .select();
            if (updErr) throw updErr;
            if (data && data.length > 0) {
                const row = data[0];
                resultAnnouncement = {
                    id: row.id,
                    text: row.text,
                    highlight: row.highlight,
                    active: row.active,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                };
            }
        } else {
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
            if (updatedAnnouncement && updatedAnnouncement.length > 0) {
                resultAnnouncement = updatedAnnouncement[0];
            }
        }

        if (!resultAnnouncement) {
            return new Response(JSON.stringify({ error: "Announcement not found" }), {
                status: 404,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }

        return new Response(JSON.stringify(resultAnnouncement), {
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
        const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

        if (shouldUseSupabaseRest(runtimeEnv)) {
            const client = supabaseAdmin || supabase;
            const { error: delErr } = await client.from("announcements").delete().eq("id", id);
            if (delErr) throw delErr;
        } else {
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
