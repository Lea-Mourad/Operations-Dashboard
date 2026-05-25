import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sanitizeJsonValue } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const payload =
    ((await request.json().catch(() => ({}))) as {
      resolution_notes?: string;
    }) ?? {};

  const reviewItem = await prisma.reviewQueueItem.findUnique({
    where: { id },
  });

  if (!reviewItem) {
    return NextResponse.json(
      { error: "Review queue item not found" },
      { status: 404 },
    );
  }

  const resolutionNotes =
    payload.resolution_notes?.trim() || "Resolved manually";

  const [updatedReviewItem] = await prisma.$transaction([
    prisma.reviewQueueItem.update({
      where: { id },
      data: {
        status: "completed",
        resolution_notes: resolutionNotes,
        resolved_at: new Date(),
      },
      include: {
        event: true,
      },
    }),
    prisma.event.update({
      where: { id: reviewItem.event_id },
      data: {
        status: "completed",
      },
    }),
    prisma.auditLog.create({
      data: {
        event_id: reviewItem.event_id,
        message: "Review queue item resolved",
        metadata: sanitizeJsonValue({
          review_queue_item_id: id,
          resolution_notes: resolutionNotes,
        }),
      },
    }),
  ]);

  return NextResponse.json({ reviewItem: updatedReviewItem });
}
