import type { APIRoute } from "astro";
import { uploadImage } from "@/lib/supabase";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST: APIRoute = async (ctx) => {
  try {
    const user = ctx.locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await ctx.request.formData();
    const file = (formData.get("file") || formData.get("image")) as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return new Response(
        JSON.stringify({ error: "No image file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: `File size exceeds limit of 5MB (received ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return new Response(
        JSON.stringify({
          error: `Unsupported image format (${file.type}). Allowed formats: JPG, JPEG, PNG, WebP.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate extension
    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      return new Response(
        JSON.stringify({
          error: "Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .webp",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Upload using established Supabase Storage architecture
    const publicUrl = await uploadImage(file, file.name);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Staff image upload error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to upload image to storage",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

