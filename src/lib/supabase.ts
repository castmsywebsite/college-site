import { createClient } from "@supabase/supabase-js";
import { dbAsyncLocalStorage } from "@/db";

export const getEnv = (key: string): string => {
  const storeEnv = dbAsyncLocalStorage.getStore()?.runtimeEnv;
  const globalEnv = (globalThis as any)?.__env__;
  return (
    storeEnv?.[key] ||
    globalEnv?.[key] ||
    (typeof globalThis !== "undefined" && (globalThis as any)?.[key]) ||
    (typeof process !== "undefined" && process.env?.[key]) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.[key]) ||
    ""
  );
};

export function isCloudflareWorker(runtimeEnv?: Record<string, any>): boolean {
  if (
    typeof process !== "undefined" &&
    process.env?.NODE_ENV === "development" &&
    process.versions?.node &&
    !(globalThis as any)?.WebSocketPair
  ) {
    return false;
  }
  return (
    (typeof navigator !== "undefined" && (navigator as any)?.userAgent === "Cloudflare-Workers") ||
    typeof (globalThis as any)?.WebSocketPair !== "undefined" ||
    typeof (globalThis as any)?.caches?.default !== "undefined" ||
    Boolean(runtimeEnv?.__CF_PAGES__) ||
    Boolean((globalThis as any)?.__CF_PAGES__) ||
    Boolean(runtimeEnv?.CF_PAGES) ||
    Boolean((globalThis as any)?.__env__?.CF_PAGES)
  );
}

export function shouldUseSupabaseRest(runtimeEnv?: Record<string, any>): boolean {
  const env =
    runtimeEnv ||
    (globalThis as any)?.__env__ ||
    dbAsyncLocalStorage.getStore()?.runtimeEnv ||
    (typeof process !== "undefined" ? process.env : undefined);

  if (env?.USE_SUPABASE_REST === "true") return true;
  if (env?.USE_SUPABASE_REST === "false") return false;

  const hasHyperdrive = Boolean(
    env?.HYPERDRIVE?.connectionString ||
    (globalThis as any)?.HYPERDRIVE?.connectionString
  );
  return isCloudflareWorker(env) && !hasHyperdrive;
}

export function getSupabaseAdminClient(passedEnv?: Record<string, any>) {
  const env = passedEnv || dbAsyncLocalStorage.getStore()?.runtimeEnv || (globalThis as any)?.__env__;
  const url = env?.SUPABASE_URL || getEnv("SUPABASE_URL");
  const key =
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    env?.SUPABASE_ANON_KEY ||
    getEnv("SUPABASE_ANON_KEY");
  if (!url || !key) return null as any;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseAnonClient(passedEnv?: Record<string, any>) {
  const env = passedEnv || dbAsyncLocalStorage.getStore()?.runtimeEnv || (globalThis as any)?.__env__;
  const url = env?.SUPABASE_URL || getEnv("SUPABASE_URL");
  const key =
    env?.SUPABASE_ANON_KEY ||
    getEnv("SUPABASE_ANON_KEY") ||
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null as any;
  return createClient(url, key);
}

let cachedStaticAdmin: any = null;
export const supabaseAdmin = new Proxy({} as any, {
  get(_target, prop) {
    const dynamicClient = getSupabaseAdminClient();
    if (dynamicClient) return dynamicClient[prop];
    if (!cachedStaticAdmin) {
      const url = getEnv("SUPABASE_URL");
      const key = getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_ANON_KEY");
      if (url && key) {
        cachedStaticAdmin = createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      }
    }
    return cachedStaticAdmin ? cachedStaticAdmin[prop] : undefined;
  },
});

let cachedStaticAnon: any = null;
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    const dynamicClient = getSupabaseAnonClient();
    if (dynamicClient) return dynamicClient[prop];
    if (!cachedStaticAnon) {
      const url = getEnv("SUPABASE_URL");
      const key = getEnv("SUPABASE_ANON_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY");
      if (url && key) {
        cachedStaticAnon = createClient(url, key);
      }
    }
    return cachedStaticAnon ? cachedStaticAnon[prop] : undefined;
  },
});

export const GALLERY_BUCKET = "gallery-images";
export const DOCUMENTS_BUCKET = "academic-documents";

export async function initializeStorageBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();

    const galleryBucketExists = buckets?.some(
      (bucket) => bucket.name === GALLERY_BUCKET
    );

    if (!galleryBucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(
        GALLERY_BUCKET,
        {
          public: true,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "application/pdf",
          ],
          fileSizeLimit: 50 * 1024 * 1024,
        }
      );

      if (error) {
        console.error("Error creating gallery bucket:", error);
      }
    }

    const documentsBucketExists = buckets?.some(
      (bucket) => bucket.name === DOCUMENTS_BUCKET
    );

    if (!documentsBucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(
        DOCUMENTS_BUCKET,
        {
          public: true,
          allowedMimeTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
          ],
          fileSizeLimit: 50 * 1024 * 1024,
        }
      );

      if (error) {
        console.error("Error creating documents bucket:", error);
      }
    }
  } catch (error) {
    console.error("Error initializing storage bucket:", error);
    throw error;
  }
}

// SEC-HIGH-04: File signature (magic bytes) & strict type validation
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;    // 10 MB

type AllowedDocType = "pdf" | "jpeg" | "png" | "webp" | "gif" | "docx";

function extractSanitizedExtension(fileName: string): string {
  const cleanName = fileName.replace(/[\0/\\]/g, "");
  const parts = cleanName.split(".");
  if (parts.length < 2) return "";
  return parts.pop()?.toLowerCase() || "";
}

async function validateFileSignatureAndMime(
  file: File,
  allowedTypes: AllowedDocType[]
): Promise<{ valid: boolean; detectedExt: string; detectedMime: string; error?: string }> {
  // Reject empty files
  if (!file || file.size === 0) {
    return { valid: false, detectedExt: "", detectedMime: "", error: "File is empty" };
  }

  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    if (!allowedTypes.includes("pdf")) {
      return { valid: false, detectedExt: "pdf", detectedMime: "application/pdf", error: "PDF format is not permitted for this upload" };
    }
    return { valid: true, detectedExt: "pdf", detectedMime: "application/pdf" };
  }

  // Check JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    if (!allowedTypes.includes("jpeg")) {
      return { valid: false, detectedExt: "jpg", detectedMime: "image/jpeg", error: "JPEG format is not permitted for this upload" };
    }
    return { valid: true, detectedExt: "jpg", detectedMime: "image/jpeg" };
  }

  // Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    if (!allowedTypes.includes("png")) {
      return { valid: false, detectedExt: "png", detectedMime: "image/png", error: "PNG format is not permitted for this upload" };
    }
    return { valid: true, detectedExt: "png", detectedMime: "image/png" };
  }

  // Check GIF: GIF87a or GIF89a (0x47 0x49 0x46 0x38)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    if (!allowedTypes.includes("gif")) {
      return { valid: false, detectedExt: "gif", detectedMime: "image/gif", error: "GIF format is not permitted for this upload" };
    }
    return { valid: true, detectedExt: "gif", detectedMime: "image/gif" };
  }

  // Check WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    if (!allowedTypes.includes("webp")) {
      return { valid: false, detectedExt: "webp", detectedMime: "image/webp", error: "WEBP format is not permitted for this upload" };
    }
    return { valid: true, detectedExt: "webp", detectedMime: "image/webp" };
  }

  // Check DOCX: PK 03 04 (0x50 0x4B 0x03 0x04)
  if (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    if (!allowedTypes.includes("docx")) {
      return { valid: false, detectedExt: "docx", detectedMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", error: "DOCX format is not permitted for this upload" };
    }
    return { valid: true, detectedExt: "docx", detectedMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  }

  return {
    valid: false,
    detectedExt: "unknown",
    detectedMime: "application/octet-stream",
    error: "File content does not match any permitted document or image format. Active, executable, SVG, or HTML files are strictly rejected.",
  };
}

export async function uploadImage(
  file: File,
  fileName: string
): Promise<string> {
  try {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`File size exceeds maximum allowed image limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
    }

    const validation = await validateFileSignatureAndMime(file, ["jpeg", "png", "webp", "gif"]);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid image file format");
    }

    const claimedExt = extractSanitizedExtension(fileName);
    const validImageExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!validImageExtensions.includes(claimedExt)) {
      throw new Error(`File extension '.${claimedExt}' is not permitted for images`);
    }

    // Secure, randomized server-side storage path
    const safeExt = validation.detectedExt;
    const filePath = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    const { data, error } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: validation.detectedMime,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export async function uploadDocument(
  file: File,
  fileName: string
): Promise<string> {
  try {
    if (file.size > MAX_DOCUMENT_SIZE) {
      throw new Error(`File size exceeds maximum allowed document limit of ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`);
    }

    const validation = await validateFileSignatureAndMime(file, ["pdf", "jpeg", "png", "webp", "docx"]);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid academic document file format");
    }

    const claimedExt = extractSanitizedExtension(fileName);
    const validDocExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "docx"];
    if (!validDocExtensions.includes(claimedExt)) {
      throw new Error(`File extension '.${claimedExt}' is not permitted for academic documents`);
    }

    // Secure, randomized server-side storage path
    const safeExt = validation.detectedExt;
    const filePath = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    await initializeStorageBucket();

    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: validation.detectedMime,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
}

export async function deleteImage(filePath: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

export async function deleteDocument(filePath: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
}

export function extractFilePathFromUrl(url: string): string {
  const urlParts = url.split("/");
  return urlParts[urlParts.length - 1];
}
