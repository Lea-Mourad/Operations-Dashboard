const { PrismaClient, Prisma } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__occPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__occPrisma = prisma;
}

module.exports = {
  prisma,
  Prisma,
};
