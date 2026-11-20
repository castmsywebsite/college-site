import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type DrizzleDatabase = ReturnType<typeof drizzle>;

export interface RequestDatabaseContext {
  db: DrizzleDatabase;
  client: ReturnType<typeof postgres>;
  runtimeEnv?: Record<string, any>;
}

// Resilient Request-scoped Context Storage compatible with both Cloudflare Workers workerd and Node.js
class ContextStore<T> {
  private _store: T | undefined;
  getStore(): T | undefined {
    return this._store || (globalThis as any)?.__active_db_context__;
  }
  run<R>(store: T, callback: () => R): R {
    const prev = this._store;
    this._store = store;
    (globalThis as any).__active_db_context__ = store;
    try {
      return callback();
    } finally {
      this._store = prev;
      (globalThis as any).__active_db_context__ = prev;
    }
  }
}

let ContextStoreClass: any = ContextStore;
if (typeof (globalThis as any)?.AsyncLocalStorage !== "undefined") {
  ContextStoreClass = (globalThis as any).AsyncLocalStorage;
}

export const dbAsyncLocalStorage = new ContextStoreClass();

// Safely resolve the database connection URL across Cloudflare Pages runtime and local Node.js environments
export function getDbUrl(runtimeEnv?: Record<string, any>): string {
  // Priority 1: Cloudflare Hyperdrive binding (accelerated edge pooling for Cloudflare Pages)
  if (runtimeEnv?.HYPERDRIVE?.connectionString) {
    return runtimeEnv.HYPERDRIVE.connectionString;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any)?.HYPERDRIVE?.connectionString) {
    return (globalThis as any).HYPERDRIVE.connectionString;
  }

  // Priority 2: Direct or Pooler DB_URL environment variable
  let url =
    runtimeEnv?.DB_URL ||
    (typeof globalThis !== "undefined" && (globalThis as any)?.__env__?.DB_URL) ||
    (typeof globalThis !== "undefined" && (globalThis as any)?.DB_URL) ||
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
export function createPostgresClient(connectionUrl?: string, runtimeEnv?: Record<string, any>) {
  const url = connectionUrl || getDbUrl(runtimeEnv);
  return postgres(url, {
    prepare: false, // MANDATORY for Supabase transaction pooler (port 6543)
    ssl: "require", // MANDATORY for Cloudflare Workers -> Supabase TCP/TLS handshake
    max: 1, // MANDATORY: exactly 1 connection per serverless isolate (never > 1 on edge workers)
    fetch_types: false, // MANDATORY: disable automatic type catalog queries to prevent subrequest exhaustion
    idle_timeout: 20, // Cleanly close idle sockets after 20s
    connect_timeout: 10, // 10s connection timeout
    max_lifetime: 60 * 15, // 15 minutes max lifetime
    backoff: (retries: number) => {
      // CRITICAL: Prevent runaway reconnect loop that exhausts Cloudflare Workers subrequest limit (50 subrequests)
      if (retries >= 2) {
        throw new Error(`Database connection failed after ${retries} attempts`);
      }
      return 0.5;
    },
  });
}

// Fallback client for outside request lifecycles (e.g. CLI scripts or background tasks)
let fallbackClient: ReturnType<typeof postgres> | null = null;
let fallbackDb: DrizzleDatabase | null = null;

function getFallbackDb(runtimeEnv?: Record<string, any>): DrizzleDatabase {
  if (!fallbackClient || !fallbackDb) {
    fallbackClient = createPostgresClient(getDbUrl(runtimeEnv), runtimeEnv);
    fallbackDb = drizzle(fallbackClient);
  }
  return fallbackDb;
}

// Create a fresh request-scoped database context for a request lifecycle
export function createRequestDb(runtimeEnv?: Record<string, any>): RequestDatabaseContext {
  const url = getDbUrl(runtimeEnv);
  const client = createPostgresClient(url, runtimeEnv);
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
    msg.includes("connection failed after") ||
    msg.includes("subrequests") ||
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
  runtimeEnvOrDb?: Record<string, any> | DrizzleDatabase,
  isIdempotent: boolean = true
): Promise<T> {
  let activeDb: DrizzleDatabase;
  let runtimeEnv: Record<string, any> | undefined;

  if (runtimeEnvOrDb && typeof (runtimeEnvOrDb as any).select === "function") {
    activeDb = runtimeEnvOrDb as DrizzleDatabase;
  } else {
    runtimeEnv = runtimeEnvOrDb as Record<string, any> | undefined;
    activeDb = getDb(runtimeEnv);
  }

  try {
    return await operation(activeDb);
  } catch (err: any) {
    if (isIdempotent && isConnectionError(err)) {
      console.warn("Idempotent DB query hit dropped connection. Resetting client and retrying once...", err.message);
      await new Promise(res => setTimeout(res, 50));
      const freshDb = resetDbClient(runtimeEnv);
      return await operation(freshDb);
    }
    throw err;
  }
}
