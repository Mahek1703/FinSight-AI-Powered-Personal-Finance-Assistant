import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/**
 * Global singleton PrismaClient instance.
 * Prevents exhausting database connections in development hot-reloads
 * and serverless function executions.
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
