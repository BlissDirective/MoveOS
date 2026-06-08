import { defineConfig } from "drizzle-kit";

// `db:generate` reads the schema and emits SQL migrations into ./migrations
// (no DB connection needed). `db:migrate` applies them using DATABASE_URL.
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
