const { listAuditEntries } = require("../services/auditService");

async function getAuditTrail(_req, res, next) {
  try {
    const result = await listAuditEntries();

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditTrail,
};
