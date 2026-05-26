const actionRepository = require("../repositories/actionRepository");
const eventRepository = require("../repositories/eventRepository");
const reviewRepository = require("../repositories/reviewRepository");

async function getDashboard(_req, res, next) {
  try {
    const [eventsByStatus, eventsBySource, reviewOpenCount, totalActions] =
      await Promise.all([
        eventRepository.groupByStatus(),
        eventRepository.groupBySource(),
        reviewRepository.countOpen(),
        actionRepository.count(),
      ]);

    res.json({
      summary: {
        open_review_items: reviewOpenCount,
        total_actions: totalActions,
        total_events: eventsByStatus.reduce(
          (sum, item) => sum + item._count._all,
          0,
        ),
      },
      events_by_status: eventsByStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      events_by_source: eventsBySource.map((item) => ({
        source: item.source,
        count: item._count._all,
      })),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
};
