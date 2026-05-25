import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventInclude } from "@/lib/workflows/engine";

export async function GET() {
  const events = await prisma.event.findMany({
    include: eventInclude,
    orderBy: {
      created_at: "desc",
    },
  });

  return NextResponse.json({ events });
}
