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

export async function PUT(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_body" }, { status: 400 });

    const incoming = {
      sevas: body.sevas || [],
      members: body.members || [],
      festivals: body.festivals || [],
      tasks: body.tasks || [],
    };

    // Members can only ever change the tasks array — sevas/team/festivals are admin-only.
    if (!isAdminRole(session.role)) {
      const existing = (await getBoard()) || {};
      const unchanged = (key) => JSON.stringify(incoming[key]) === JSON.stringify(existing[key] || []);
      if (!unchanged("sevas") || !unchanged("members") || !unchanged("festivals")) {
        return NextResponse.json({ error: "forbidden", message: "Only admins can change sevas, team, or festivals." }, { status: 403 });
      }
    }

    await saveBoard({ ...incoming, updatedAt: Date.now() });
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
