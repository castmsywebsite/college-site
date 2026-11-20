import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { AsyncLocalStorage } from "node:async_hooks";

export type DrizzleDatabase = ReturnType<typeof drizzle>;

export interface RequestDatabaseContext {
  db: DrizzleDatabase;
  client: ReturnType<typeof postgres>;
  runtimeEnv?: Record<string, any>;
}

// AsyncLocalStorage providing request-scoped database isolation for Cloudflare Workers
export const dbAsyncLocalStorage = new AsyncLocalStorage<RequestDatabaseContext>();

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
    max: 5, // Support up to 5 concurrent queries per request isolate (e.g. Promise.all)
    idle_timeout: 15, // Cleanly close idle sockets after 15s
    connect_timeout: 10, // 10s connection timeout
  });
}

// Fallback client for outside request lifecycles (e.g. CLI scripts or background tasks)
let fallbackClient: ReturnType<typeof postgres> | null = null;
let fallbackDb: DrizzleDatabase | null = null;

function getFallbackDb(runtimeEnv?: Record<string, any>): DrizzleDatabase {
  if (!fallbackClient || !fallbackDb) {
    fallbackClient = createPostgresClient(getDbUrl(runtimeEnv));
    fallbackDb = drizzle(fallbackClient);
  }
  return fallbackDb;
}

// Create a fresh request-scoped database context for a request lifecycle
export function createRequestDb(runtimeEnv?: Record<string, any>): RequestDatabaseContext {
  const url = getDbUrl(runtimeEnv);
  const client = createPostgresClient(url);
  const db = drizzle(client);
  return { db, client, runtimeEnv };
}

// Retrieve the database instance: uses current request's store from AsyncLocalStorage if available
export function getDb(runtimeEnv?: Record<string, any>): DrizzleDatabase {
  const store = dbAsyncLocalStorage.getStore();
  if (store?.db) {
    return store.db;
  }
  return getFallbackDb(runtimeEnv);
}

// Reset client and re-establish fresh connection if needed
export function resetDbClient(runtimeEnv?: Record<string, any>): DrizzleDatabase {
  const store = dbAsyncLocalStorage.getStore();
  if (store) {
    try {
      store.client.end({ timeout: 1 }).catch(() => {});
    } catch {}
    const newContext = createRequestDb(runtimeEnv || store.runtimeEnv);
    store.client = newContext.client;
    store.db = newContext.db;
    return store.db;
  }

  if (fallbackClient) {
    try {
      fallbackClient.end({ timeout: 1 }).catch(() => {});
    } catch {}
    fallbackClient = null;
    fallbackDb = null;
  }
  return getFallbackDb(runtimeEnv);
}

// Transparent Proxy so any module importing `db` directly gets the active request-scoped client
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
    msg.includes("cannot perform i/o") ||
    code === "57p01" || // ADMIN SHUTDOWN
    code === "08006" || // CONNECTION FAILURE
    code === "08001" || // SQLCLIENT UNABLE TO ESTABLISH SQLCONNECTION
    code === "08004"    // SQLSERVER REJECTED ESTABLISHMENT OF SQLCONNECTION
  );
}

// Executes an operation with automatic single retry on transient connection drops
// CRITICAL SAFETY RULE: Retries ONLY idempotent read operations (SELECT).
// Never automatically retries mutations (INSERT, UPDATE, DELETE) to prevent duplicates.
export async function withDbRetry<T>(
  operation: (database: DrizzleDatabase) => Promise<T>,
  runtimeEnv?: Record<string, any>,
  isIdempotent: boolean = true
): Promise<T> {
  const activeDb = getDb(runtimeEnv);
  try {
    return await operation(activeDb);
  } catch (err: any) {
    if (isIdempotent && isConnectionError(err)) {
      console.warn("Idempotent DB query hit dropped connection. Retrying once...", err.message);
      await new Promise(res => setTimeout(res, 50));
      return await operation(activeDb);
    }
    throw err;
  }
}
