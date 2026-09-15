import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Standard Postgres wire-protocol driver — works with Supabase (and any
// Postgres host). Use Supabase's connection pooler URL (port 6543) in
// serverless/Vercel environments; the direct connection (port 5432) is fine
// for migrations run from a local machine.
const client = postgres(process.env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
