import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// PrismaNeon takes a neon.PoolConfig (which includes connectionString).
// driver adapters are GA in Prisma 7 — no previewFeatures needed.
// neonConfig.webSocketConstructor is only required for Node.js < 21;
// omitted here; add `ws` package + neonConfig setup if deploying on Node 18/20.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
