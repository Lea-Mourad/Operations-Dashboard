const express = require("express");
const { getAuditTrail } = require("../controllers/audit.controller");

const router = express.Router();

router.get("/audit", getAuditTrail);

module.exports = router;
