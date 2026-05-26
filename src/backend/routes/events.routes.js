const express = require("express");

const {
  getEventById,
  listEvents,
  submitEvent,
} = require("../controllers/events.controller");
const { validateJson } = require("../middleware/validateJson");

const router = express.Router();

router.get("/events", listEvents);
router.get("/events/:id", getEventById);
router.post("/events/submit", validateJson, submitEvent);

module.exports = router;
