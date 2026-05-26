const express = require("express");
const { getDashboard } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/dashboard", getDashboard);

module.exports = router;
