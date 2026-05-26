const { prisma } = require("../db/prisma");

function createMany(data) {
  return prisma.action.createMany({ data });
}

function count() {
  return prisma.action.count();
}

function deleteMany() {
  return prisma.action.deleteMany();
}

module.exports = {
  createMany,
  count,
  deleteMany,
};
