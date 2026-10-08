import { PrismaClient } from "@prisma/client";

// One PrismaClient per process. In development Next.js hot-reloads modules,
// so the instance is cached on globalThis to avoid exhausting MySQL connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
