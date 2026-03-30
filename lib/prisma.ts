import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Standard TCP connection pool — fast for Node.js / Neon
const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  console.warn("⚠️ DATABASE_URL is not set. Build might fail if static generation is used.");
}

const pool = connectionString ? new Pool({
  connectionString,
  max: process.env.NODE_ENV === "production" ? 10 : 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}) : null;

const prismaClientSingleton = () => {
  if (!connectionString) {
    // Return a dummy object during build to prevent constructor validation errors
    return new Proxy({} as any, {
      get: (_, prop) => {
        if (prop === "on" || prop === "$on") return () => {};
        if (prop === "$connect") return async () => {};
        if (prop === "$disconnect") return async () => {};
        return () => { throw new Error(`Prisma accessed during build without DATABASE_URL for: ${String(prop)}`); };
      },
    }) as any;
  }
  const adapter = new PrismaPg(pool!);
  return new PrismaClient({ adapter });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();
export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
