import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(import.meta.env.DB_URL, {
  prepare: false,
});

export const db = drizzle(client);