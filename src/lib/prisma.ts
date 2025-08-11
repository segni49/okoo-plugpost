import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prefer UNPOOLED for local/dev stability; fallback to DATABASE_URL
const datasourceUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: datasourceUrl } } })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
