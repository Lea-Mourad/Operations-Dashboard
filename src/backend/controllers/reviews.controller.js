const { prisma } = require("../db/prisma");
const auditRepository = require("../repositories/auditRepository");
const eventRepository = require("../repositories/eventRepository");
const reviewRepository = require("../repositories/reviewRepository");
const { sanitizeJsonValue } = require("../services/workflowUtils");

async function listReviews(_req, res, next) {
  try {
    const reviewItems = await reviewRepository.findMany();

    res.json({ reviewItems });
  } catch (error) {
    next(error);
  }
}

async function resolveReview(req, res, next) {
  try {
    const reviewItem = await reviewRepository.findById(req.params.id);

    if (!reviewItem) {
      return res.status(404).json({ error: "Review queue item not found" });
    }

    const resolutionNotes =
      typeof req.body?.resolution_notes === "string" &&
      req.body.resolution_notes.trim().length > 0
        ? req.body.resolution_notes.trim()
        : "Resolved manually";

    const [updatedReviewItem] = await prisma.$transaction([
      reviewRepository.update(reviewItem.id, {
        status: "completed",
        resolution_notes: resolutionNotes,
        resolved_at: new Date(),
      }),
      eventRepository.updateStatus(reviewItem.event_id, "completed"),
      auditRepository.create({
        event_id: reviewItem.event_id,
        message: "Review queue item resolved",
        metadata: sanitizeJsonValue({
          review_queue_item_id: reviewItem.id,
          resolution_notes: resolutionNotes,
        }),
      }),
    ]);

    res.json({ reviewItem: updatedReviewItem });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listReviews,
  resolveReview,
};
