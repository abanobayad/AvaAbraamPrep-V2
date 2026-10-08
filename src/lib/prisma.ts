import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

// Cloudflare injects the D1 database binding into the global context
export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

let prisma: PrismaClient | undefined

export const getPrisma = (env: Env) => {
  if (prisma) return prisma

  const adapter = new PrismaD1(env.DB)
  prisma = new PrismaClient({ adapter })
  return prisma
}
