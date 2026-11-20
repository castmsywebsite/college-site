import type { APIRoute } from "astro";
import { homepageEventsTable } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAdminAuth } from "@/lib/api-auth";
import { withDbRetry } from "@/db";

export const GET: APIRoute = async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const showAll = url.searchParams.get("all") === "true";
    const user = ctx.locals.user;
    const includeUnpublished = showAll && Boolean(user);

    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");
    let events: any[] = [];

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      let query = client
        .from("homepage_events")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!includeUnpublished) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      events = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || "",
        eventDate: row.event_date || "",
        imageUrl: row.image_url || "",
        eventType: row.event_type || "",
        participants: row.participants || "",
        isPublished: row.is_published ?? true,
        displayOrder: row.display_order ?? 99,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } else {
      try {
        const rows = await withDbRetry(async (db) => {
          let baseQuery = db.select().from(homepageEventsTable);
          if (!includeUnpublished) {
            return await baseQuery
              .where(eq(homepageEventsTable.isPublished, true))
              .orderBy(asc(homepageEventsTable.displayOrder), desc(homepageEventsTable.createdAt));
          }
          return await baseQuery
            .orderBy(asc(homepageEventsTable.displayOrder), desc(homepageEventsTable.createdAt));
        }, (ctx.locals as any)?.db || runtimeEnv);

        events = (rows || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description || "",
          eventDate: row.eventDate || "",
          imageUrl: row.imageUrl || "",
          eventType: row.eventType || "",
          participants: row.participants || "",
          isPublished: row.isPublished ?? true,
          displayOrder: row.displayOrder ?? 99,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      } catch (dbError: any) {
        console.warn("Homepage Events Drizzle query failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        let query = client
          .from("homepage_events")
          .select("*")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (!includeUnpublished) {
          query = query.eq("is_published", true);
        }

        const { data, error } = await query;
        if (error) throw error;
        events = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description || "",
          eventDate: row.event_date || "",
          imageUrl: row.image_url || "",
          eventType: row.event_type || "",
          participants: row.participants || "",
          isPublished: row.is_published ?? true,
          displayOrder: row.display_order ?? 99,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    }

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": includeUnpublished ? "no-cache" : "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: any) {
    console.error("Error fetching homepage events:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch events", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
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

    const id = uuidv4();
    const now = new Date();
    const runtimeEnv = (ctx.locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("@/lib/supabase");

    let createdRecord: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("homepage_events")
        .insert({
          id,
          title,
          description: description || null,
          event_date: eventDate || null,
          image_url: imageUrl || null,
          event_type: eventType || null,
          participants: participants || null,
          is_published: isPublished,
          display_order: displayOrder,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        createdRecord = {
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
            .insert(homepageEventsTable)
            .values({
              id,
              title,
              description: description || null,
              eventDate: eventDate || null,
              imageUrl: imageUrl || null,
              eventType: eventType || null,
              participants: participants || null,
              isPublished,
              displayOrder,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
        }, (ctx.locals as any)?.db || runtimeEnv);

        if (rows && rows.length > 0) {
          const row = rows[0];
          createdRecord = {
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
        console.warn("Homepage Events Drizzle insert failed, falling back to Supabase REST:", dbError?.message);
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from("homepage_events")
          .insert({
            id,
            title,
            description: description || null,
            event_date: eventDate || null,
            image_url: imageUrl || null,
            event_type: eventType || null,
            participants: participants || null,
            is_published: isPublished,
            display_order: displayOrder,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const row = data[0];
          createdRecord = {
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

    return new Response(JSON.stringify(createdRecord || { id, title, isPublished }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating homepage event:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create event", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
