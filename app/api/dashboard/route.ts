import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [eventsByStatus, eventsBySource, reviewOpenCount, totalActions] =
    await Promise.all([
      prisma.event.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      prisma.event.groupBy({
        by: ["source"],
        _count: {
          _all: true,
        },
      }),
      prisma.reviewQueueItem.count({
        where: {
          status: "review_required",
        },
      }),
      prisma.action.count(),
    ]);

  return NextResponse.json({
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
}
