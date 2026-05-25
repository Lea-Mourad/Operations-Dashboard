import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const reviewItems = await prisma.reviewQueueItem.findMany({
    include: {
      event: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return NextResponse.json({ reviewItems });
}
