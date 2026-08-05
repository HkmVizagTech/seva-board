import { NextResponse } from "next/server";
import { getBoard, saveBoard } from "../../../lib/mongodb";
import { currentSession, isAdminRole } from "../../../lib/authGuard";
import { broadcast } from "../../../lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await currentSession(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const board = await getBoard();
    return NextResponse.json(board);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}

// Admin-only, and deliberately only ever writes sevas/members/festivals — tasks are
// handled by /api/board/tasks and /api/board/tasks/[id], which use atomic single-task
// MongoDB operations instead of whole-array replace. Since this route only $sets the
// keys it's given, omitting "tasks" here means tasks are never touched by this endpoint.
export async function PUT(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdminRole(session.role)) return NextResponse.json({ error: "forbidden", message: "Only admins can change sevas, team, or festivals." }, { status: 403 });

  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_body" }, { status: 400 });

    const patch = { updatedAt: Date.now() };
    if ("sevas" in body) patch.sevas = body.sevas;
    if ("members" in body) patch.members = body.members;
    if ("festivals" in body) patch.festivals = body.festivals;

    await saveBoard(patch);
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
