import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv =
    (locals as any)?.runtime?.env ||
    (globalThis as any)?.__env__ ||
    (typeof process !== "undefined" ? process.env : undefined);

  const hyperdrive = runtimeEnv?.HYPERDRIVE?.connectionString || (globalThis as any)?.HYPERDRIVE?.connectionString;
  const dbUrl = hyperdrive || runtimeEnv?.DB_URL || "";
  let host = "";
  try {
    if (dbUrl) {
      host = new URL(dbUrl).host;
    }
  } catch {}

  return new Response(
    JSON.stringify({
      status: "ok",
      version: "hyperdrive-ready",
      hasHyperdrive: Boolean(hyperdrive),
      hasDbUrl: Boolean(dbUrl),
      hasSupabaseUrl: Boolean(runtimeEnv?.SUPABASE_URL || (globalThis as any)?.__env__?.SUPABASE_URL || process.env?.SUPABASE_URL),
      hasSupabaseKey: Boolean(runtimeEnv?.SUPABASE_SERVICE_ROLE_KEY || runtimeEnv?.SUPABASE_ANON_KEY || (globalThis as any)?.__env__?.SUPABASE_SERVICE_ROLE_KEY || (globalThis as any)?.__env__?.SUPABASE_ANON_KEY || process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.SUPABASE_ANON_KEY),
      dbHost: host,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
