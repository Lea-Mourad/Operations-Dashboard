const eventRepository = require("../repositories/eventRepository");
const { processIncomingEvent } = require("../services/workflowEngine");

async function submitEvent(req, res, next) {
  try {
    const result = await processIncomingEvent(req.body);

    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
}

async function listEvents(_req, res, next) {
  try {
    const events = await eventRepository.findMany();

    res.json({ events });
  } catch (error) {
    next(error);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await eventRepository.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitEvent,
  listEvents,
  getEventById,
};
