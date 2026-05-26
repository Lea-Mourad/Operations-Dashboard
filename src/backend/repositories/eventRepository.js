const { prisma } = require("../db/prisma");

const eventInclude = {
  actions: {
    orderBy: {
      created_at: "asc",
    },
  },
  review_queue_items: {
    orderBy: {
      created_at: "asc",
    },
  },
  audit_logs: {
    orderBy: {
      created_at: "asc",
    },
  },
};

function findMany() {
  return prisma.event.findMany({
    include: eventInclude,
    orderBy: {
      created_at: "desc",
    },
  });
}

function findById(id) {
  return prisma.event.findUnique({
    where: { id },
    include: eventInclude,
  });
}

function findBySourceEventId(sourceEventId) {
  return prisma.event.findUnique({
    where: {
      source_event_id: sourceEventId,
    },
    include: eventInclude,
  });
}

function create(data) {
  return prisma.event.create({
    data,
  });
}

function updateStatus(id, status) {
  return prisma.event.update({
    where: { id },
    data: {
      status,
    },
  });
}

function update(id, data) {
  return prisma.event.update({
    where: { id },
    data,
  });
}

function getSnapshot(id) {
  return prisma.event.findUniqueOrThrow({
    where: { id },
    include: eventInclude,
  });
}

function groupByStatus() {
  return prisma.event.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });
}

function groupBySource() {
  return prisma.event.groupBy({
    by: ["source"],
    _count: {
      _all: true,
    },
  });
}

function deleteMany() {
  return prisma.event.deleteMany();
}

module.exports = {
  eventInclude,
  findMany,
  findById,
  findBySourceEventId,
  create,
  updateStatus,
  update,
  getSnapshot,
  groupByStatus,
  groupBySource,
  deleteMany,
};
