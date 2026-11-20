import type { APIRoute } from "astro";
import { galleryImages } from "../../../db/schema/gallery";
import { eq } from "drizzle-orm";
import { withDbRetry } from "@/db";
import { validateSameOrigin } from "@/lib/api-auth";

// GET /api/gallery/[id] - Get single gallery image
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id!);

    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid image ID" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const runtimeEnv = (locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("../../../lib/supabase");
    let image: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("gallery_images")
        .select("*")
        .eq("id", id)
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        image = {
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
        };
      }
    } else {
      image = await withDbRetry(async (database) => {
        const [img] = await database
          .select()
          .from(galleryImages)
          .where(eq(galleryImages.id, id));
        return img;
      }, runtimeEnv);
    }

    if (!image) {
      return new Response(JSON.stringify({ error: "Image not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify(image), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error fetching gallery image:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to fetch gallery image" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// PUT /api/gallery/[id] - Update gallery image
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    const id = parseInt(params.id!);

    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid image ID" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const body = await request.json();
    const { title, description, category } = body;

    if (!title || !category) {
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

    const runtimeEnv = (locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("../../../lib/supabase");
    let updatedImage: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error: updErr } = await client
        .from("gallery_images")
        .update({
          title,
          description: description || null,
          category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();
      if (updErr) throw updErr;
      if (data && data.length > 0) {
        const row = data[0];
        updatedImage = {
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
        };
      }
    } else {
      updatedImage = await withDbRetry(async (database) => {
        const [updated] = await database
          .update(galleryImages)
          .set({
            title,
            description: description || null,
            category,
            updatedAt: new Date(),
          })
          .where(eq(galleryImages.id, id))
          .returning();
        return updated;
      }, runtimeEnv, false);
    }

    if (!updatedImage) {
      return new Response(JSON.stringify({ error: "Image not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify(updatedImage), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error updating gallery image:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to update gallery image" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// DELETE /api/gallery/[id] - Delete gallery image
export const DELETE: APIRoute = async ({ params, request, locals }) => {
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

    const id = parseInt(params.id!);

    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid image ID" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const runtimeEnv = (locals as any)?.runtime?.env;
    const { shouldUseSupabaseRest, supabaseAdmin, supabase } = await import("../../../lib/supabase");
    let image: any = null;

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from("gallery_images")
        .select("*")
        .eq("id", id)
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const row = data[0];
        image = {
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
        };
      }
    } else {
      image = await withDbRetry(async (database) => {
        const [img] = await database
          .select()
          .from(galleryImages)
          .where(eq(galleryImages.id, id));
        return img;
      }, runtimeEnv);
    }

    if (!image) {
      return new Response(JSON.stringify({ error: "Image not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const { deleteImage, extractFilePathFromUrl } = await import(
      "../../../lib/supabase"
    );
    const filePath = extractFilePathFromUrl(image.imageUrl);
    await deleteImage(filePath);

    if (shouldUseSupabaseRest(runtimeEnv)) {
      const client = supabaseAdmin || supabase;
      const { error: delErr } = await client.from("gallery_images").delete().eq("id", id);
      if (delErr) throw delErr;
    } else {
      await withDbRetry(async (database) => {
        await database.delete(galleryImages).where(eq(galleryImages.id, id));
      }, runtimeEnv, false);
    }

    return new Response(
      JSON.stringify({ message: "Image deleted successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error deleting gallery image:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to delete gallery image" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
