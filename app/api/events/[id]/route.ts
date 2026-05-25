import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { eventInclude } from "@/lib/workflows/engine";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: eventInclude,
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}
