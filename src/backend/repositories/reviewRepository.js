const { prisma } = require("../db/prisma");

function findMany() {
  return prisma.reviewQueueItem.findMany({
    include: {
      event: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

function countOpen() {
  return prisma.reviewQueueItem.count({
    where: {
      status: "review_required",
    },
  });
}

function findById(id) {
  return prisma.reviewQueueItem.findUnique({
    where: { id },
  });
}

function create(data) {
  return prisma.reviewQueueItem.create({ data });
}

function update(id, data) {
  return prisma.reviewQueueItem.update({
    where: { id },
    data,
    include: {
      event: true,
    },
  });
}

function deleteMany() {
  return prisma.reviewQueueItem.deleteMany();
}

module.exports = {
  findMany,
  countOpen,
  findById,
  create,
  update,
  deleteMany,
};
