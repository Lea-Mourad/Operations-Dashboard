const { prisma } = require("../db/prisma");

function create(data) {
  return prisma.auditLog.create({ data });
}

function createMany(data) {
  return prisma.auditLog.createMany({ data });
}

function count() {
  return prisma.auditLog.count();
}

function findMany() {
  return prisma.auditLog.findMany({
    include: {
      event: {
        select: {
          id: true,
          source: true,
          source_event_id: true,
          event_type: true,
          status: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

function deleteMany() {
  return prisma.auditLog.deleteMany();
}

module.exports = {
  create,
  createMany,
  count,
  findMany,
  deleteMany,
};
