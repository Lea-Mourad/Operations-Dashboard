const auditRepository = require("../repositories/auditRepository");

async function listAuditEntries() {
  const auditItems = await auditRepository.findMany();

  return {
    auditItems,
  };
}

module.exports = {
  listAuditEntries,
};
