import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// quiet: true suppresses dotenv's stdout "tip" banner (recent dotenv
// versions print a rotating promotional tip on every load, including one
// pointing at an unrelated third-party domain marketed as "auth for
// agents" — not something to visit or act on).
config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
