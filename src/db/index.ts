import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type DrizzleDatabase = ReturnType<typeof drizzle>;

// Safely resolve the database connection URL across Cloudflare Pages runtime and local Node.js environments
export function getDbUrl(runtimeEnv?: Record<string, any>): string {
  let url =
    runtimeEnv?.DB_URL ||
    (typeof process !== "undefined" && process.env?.DB_URL ? process.env.DB_URL : undefined) ||
    (typeof import.meta !== "undefined" && import.meta.env?.DB_URL ? import.meta.env.DB_URL : undefined);

  if (!url) {
    throw new Error(
      "DB_URL is not defined in runtime environment, process.env, or import.meta.env"
    );
  }

  // Ensure SSL requirement for Supabase pooler connections
  if (url.includes("supabase.com") && !url.includes("sslmode=")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}sslmode=require`;
  }

  return url;
}

// Create a Postgres client configured specifically for serverless edge workers and Supabase transaction pooler
export function createPostgresClient(connectionUrl?: string) {
  const url = connectionUrl || getDbUrl();
  return postgres(url, {
    prepare: false, // MANDATORY for Supabase transaction pooler (port 6543)
    ssl: "require", // MANDATORY for Cloudflare Workers -> Supabase TCP/TLS handshake
    max: 1, // 1 connection per serverless isolate to prevent pool exhaustion
    idle_timeout: 20, // Cleanly close idle sockets after 20s
    connect_timeout: 10, // 10s connection timeout
    max_lifetime: 60 * 30, // 30 minutes max lifetime
  });
}

// Active singleton client & drizzle instance
let currentClient: ReturnType<typeof postgres> | null = null;
let currentDb: DrizzleDatabase | null = null;

export function getDb(runtimeEnv?: Record<string, any>): DrizzleDatabase {
  if (!currentClient || !currentDb) {
    const url = getDbUrl(runtimeEnv);
    currentClient = createPostgresClient(url);
    currentDb = drizzle(currentClient);
  }
  return currentDb;
}

// Reset client and re-establish fresh connection if a socket drops
export function resetDbClient(runtimeEnv?: Record<string, any>): DrizzleDatabase {
  if (currentClient) {
    try {
      currentClient.end({ timeout: 1 }).catch(() => {});
    } catch {}
    currentClient = null;
    currentDb = null;
  }
  return getDb(runtimeEnv);
}

// Transparent Proxy so any module importing `db` directly gets the active, healthy client
export const db = new Proxy({} as DrizzleDatabase, {
  get(_target, prop) {
    const activeDb = getDb();
    const value = (activeDb as any)[prop];
    if (typeof value === "function") {
      return value.bind(activeDb);
    }
    return value;
  },
});

// Helper to determine if an error is due to a dropped or stale database connection
export function isConnectionError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  const code = String(error.code || "").toLowerCase();
  return (
    msg.includes("connection terminated") ||
    msg.includes("socket is closed") ||
    msg.includes("this socket has been ended") ||
    msg.includes("connection closed") ||
    msg.includes("econnreset") ||
    msg.includes("broken pipe") ||
    code === "57p01" || // ADMIN SHUTDOWN
    code === "08006" || // CONNECTION FAILURE
    code === "08001" || // SQLCLIENT UNABLE TO ESTABLISH SQLCONNECTION
    code === "08004"    // SQLSERVER REJECTED ESTABLISHMENT OF SQLCONNECTION
  );
}

// Executes an operation with automatic single retry on transient connection drops
export async function withDbRetry<T>(
  operation: (database: DrizzleDatabase) => Promise<T>,
  runtimeEnv?: Record<string, any>
): Promise<T> {
  const activeDb = getDb(runtimeEnv);
  try {
    return await operation(activeDb);
  } catch (err: any) {
    if (isConnectionError(err)) {
      console.warn("Database connection dropped or stale. Reconnecting and retrying...", err.message);
      const freshDb = resetDbClient(runtimeEnv);
      return await operation(freshDb);
    }
    throw err;
  }
}
