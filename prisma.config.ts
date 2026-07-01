import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL out of schema.prisma. Migrate/introspect
// commands (db push, migrate, studio) read the datasource URL from here.
// Runtime queries use the driver adapter configured in src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
