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
      dbHost: host,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
