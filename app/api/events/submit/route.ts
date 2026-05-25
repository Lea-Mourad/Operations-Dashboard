import { NextResponse } from "next/server";

import { processIncomingEvent } from "@/lib/workflows/engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await processIncomingEvent(body);

    return NextResponse.json(result, {
      status: result.duplicate ? 200 : 201,
    });
  } catch (error) {
    const result = await processIncomingEvent({
      payload: {
        parse_error:
          error instanceof Error ? error.message : "Unable to parse request",
      },
    });

    return NextResponse.json(result, { status: 201 });
  }
}
