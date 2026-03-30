import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Standard TCP connection pool — fast for Node.js / Neon
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const pool = new Pool({
  connectionString,
  // Keep a small pool in dev, larger in prod
  max: process.env.NODE_ENV === "production" ? 10 : 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const prismaClientSingleton = () => {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();
export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
