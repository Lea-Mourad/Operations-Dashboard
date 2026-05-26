const { prisma } = require("../db/prisma");

function createMany(data) {
  return prisma.action.createMany({ data });
}

function count() {
  return prisma.action.count();
}

function deleteByEventId(eventId) {
  return prisma.action.deleteMany({
    where: {
      event_id: eventId,
    },
  });
}

function deleteMany() {
  return prisma.action.deleteMany();
}

module.exports = {
  createMany,
  count,
  deleteByEventId,
  deleteMany,
};
