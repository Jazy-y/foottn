import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const requested = body?.requestedDate ?? new Date().toISOString();
  return NextResponse.json({
    requestedDate: requested,
    suggestedSlots: ["18:00", "19:00", "21:00"],
  });
}
