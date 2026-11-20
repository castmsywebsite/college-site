import type { APIRoute } from "astro";
import { galleryImages } from "../../../db/schema/gallery";
import { eq } from "drizzle-orm";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const runtimeEnv = (locals as any)?.runtime?.env;

    let images: any[] = [];
    try {
      images = await withDbRetry(async (database) => {
        if (category && category !== "all") {
          return await database
            .select()
            .from(galleryImages)
            .where(eq(galleryImages.category, category))
            .orderBy(galleryImages.createdAt);
        } else {
          return await database
            .select()
            .from(galleryImages)
            .orderBy(galleryImages.createdAt);
        }
      }, (locals as any)?.db || runtimeEnv);
    } catch (dbError: any) {
      console.warn("Gallery Drizzle query failed, falling back to Supabase REST:", dbError?.message);
      const { supabaseAdmin, supabase } = await import("../../../lib/supabase");
      const client = supabaseAdmin || supabase;
      let query = client.from("gallery_images").select("*").order("created_at", { ascending: true });
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) throw error;
      images = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        imageUrl: row.image_url,
        fileName: row.file_name,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    return new Response(JSON.stringify(images), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error fetching gallery images:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to fetch gallery images" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!validateSameOrigin(request)) {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Cross-Origin request blocked" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const file = formData.get("file") as File;

    if (!title || !category || !file) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { uploadImage } = await import("../../../lib/supabase");
    const imageUrl = await uploadImage(file, file.name);

    const runtimeEnv = (locals as any)?.runtime?.env;
    const newImage = await withDbRetry(async (database) => {
      const [inserted] = await database
        .insert(galleryImages)
        .values({
          title,
          description: description || null,
          category,
          imageUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        })
        .returning();
      return inserted;
    }, runtimeEnv, false);

    return new Response(JSON.stringify(newImage), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error creating gallery image:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to create gallery image" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
