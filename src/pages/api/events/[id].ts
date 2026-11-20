import type { APIRoute } from "astro";
import { homepageEventsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const PUT: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = ctx.params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Event ID is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await ctx.request.json();
    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    const eventDate = (body.eventDate || body.date || "").trim();
    const imageUrl = (body.imageUrl || body.image || "").trim();
    const eventType = (body.eventType || body.type || "").trim();
    const participants = (body.participants || "").trim();
    const isPublished = typeof body.isPublished === "boolean" ? body.isPublished : true;
    const displayOrder = typeof body.displayOrder === "number" ? body.displayOrder : 99;

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Event Title is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    let updatedRecord: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("homepage_events")
        .update({
          title,
          description: description || null,
          event_date: eventDate || null,
          image_url: imageUrl || null,
          event_type: eventType || null,
          participants: participants || null,
          is_published: isPublished,
          display_order: displayOrder,
          updated_at: now.toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        updatedRecord = {
          id: row.id,
          title: row.title,
          description: row.description || "",
          eventDate: row.event_date || "",
          imageUrl: row.image_url || "",
          eventType: row.event_type || "",
          participants: row.participants || "",
          isPublished: row.is_published,
          displayOrder: row.display_order,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } else {
      try {
        const rows = await withDbRetry(async (db) => {
          return await db
            .update(homepageEventsTable)
            .set({
              title,
              description: description || null,
              eventDate: eventDate || null,
              imageUrl: imageUrl || null,
              eventType: eventType || null,
              participants: participants || null,
              isPublished,
              displayOrder,
              updatedAt: now,
            })
            .where(eq(homepageEventsTable.id, id))
            .returning();
        }, (ctx.locals as any)?.db || runtimeEnv);

        if (rows && rows.length > 0) {
          const row = rows[0];
          updatedRecord = {
            id: row.id,
            title: row.title,
            description: row.description || "",
            eventDate: row.eventDate || "",
            imageUrl: row.imageUrl || "",
            eventType: row.eventType || "",
            participants: row.participants || "",
            isPublished: row.isPublished,
            displayOrder: row.displayOrder,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          };
        }
      } catch (dbError: any) {
        console.warn("Homepage Events Drizzle update failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from("homepage_events")
          .update({
            title,
            description: description || null,
            event_date: eventDate || null,
            image_url: imageUrl || null,
            event_type: eventType || null,
            participants: participants || null,
            is_published: isPublished,
            display_order: displayOrder,
            updated_at: now.toISOString(),
          })
          .eq("id", id)
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const row = data[0];
          updatedRecord = {
            id: row.id,
            title: row.title,
            description: row.description || "",
            eventDate: row.event_date || "",
            imageUrl: row.image_url || "",
            eventType: row.event_type || "",
            participants: row.participants || "",
            isPublished: row.is_published,
            displayOrder: row.display_order,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        }
      }
    }

    return new Response(JSON.stringify(updatedRecord || { id, title, isPublished }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error updating homepage event:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update event", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = ctx.params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Event ID is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error } = await client.from("homepage_events").delete().eq("id", id);
      if (error) throw error;
    } else {
      try {
        await withDbRetry(async (db) => {
          return await db.delete(homepageEventsTable).where(eq(homepageEventsTable.id, id));
        }, (ctx.locals as any)?.db || runtimeEnv);
      } catch (dbError: any) {
        console.warn("Homepage Events Drizzle delete failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { error } = await client.from("homepage_events").delete().eq("id", id);
        if (error) throw error;
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Event deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error deleting homepage event:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete event", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
