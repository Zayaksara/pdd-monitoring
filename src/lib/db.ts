import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Driver adapters are GA in Prisma 7. PrismaPg (node-postgres) connects to any
// standard Postgres over TCP, including Prisma Postgres (db.prisma.io) and
// works on Vercel serverless functions.
//
// The client is created LAZILY via a Proxy: importing this module must not
// instantiate the client or read DATABASE_URL, otherwise Next.js build-time
// "collect page data" (which imports route modules) fails when the env var is
// absent at build time. The real client is created on first query at runtime.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — cannot create the Prisma client.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
