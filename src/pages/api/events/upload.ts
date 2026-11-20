import type { APIRoute } from "astro";
import { uploadEventImage } from "@/lib/supabase";
import { requireAdminAuth } from "@/lib/api-auth";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST: APIRoute = async (ctx) => {
  const auth = requireAdminAuth(ctx);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const formData = await ctx.request.formData();
    const file = (formData.get("file") || formData.get("image")) as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return new Response(
        JSON.stringify({ error: "No event image provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: `File size exceeds 5MB limit (received ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return new Response(
        JSON.stringify({
          error: `Unsupported image format (${file.type}). Allowed formats: JPG, JPEG, PNG, WebP.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      return new Response(
        JSON.stringify({
          error: "Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .webp",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const publicUrl = await uploadEventImage(file, file.name);

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
    console.error("Event image upload error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to upload event image",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
