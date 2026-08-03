import { NextResponse } from "next/server";

// Deliberately unauthenticated — Railway's healthcheck hits this on every deploy,
// and it shouldn't fail just because BOARD_PASSWORD is set on /api/board.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
