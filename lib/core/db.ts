import { PrismaClient } from "@/lib/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
  datasourceUrl: process.env.DATABASE_URL,
  log: ["warn", "error"] 
})

if (globalForPrisma.prisma === undefined) {
  console.log("🐘 Creating new PrismaClient instance...")
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
