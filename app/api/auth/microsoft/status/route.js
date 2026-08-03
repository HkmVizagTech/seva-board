import { NextResponse } from "next/server";
import { getDelegatedStatus, disconnectDelegated } from "../../../../../lib/msDelegatedAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req) {
  const need = process.env.BOARD_PASSWORD;
  if (!need) return true;
  return req.headers.get("x-board-pass") === need;
}

export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const status = await getDelegatedStatus();
    return NextResponse.json(status);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ connected: false, error: "status_error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await disconnectDelegated();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "disconnect_failed" }, { status: 500 });
  }
}
