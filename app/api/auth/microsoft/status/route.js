import { NextResponse } from "next/server";
import { getDelegatedStatus, disconnectDelegated } from "../../../../../lib/msDelegatedAuth";
import { currentSession } from "../../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const status = await getDelegatedStatus();
    return NextResponse.json(status);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ connected: false, error: "status_error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    await disconnectDelegated();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "disconnect_failed" }, { status: 500 });
  }
}
