import { NextResponse } from "next/server";
import { createTaskInBoard, saveBoard } from "../../../../lib/mongodb";
import { currentSession, isAdminRole } from "../../../../lib/authGuard";
import { broadcast } from "../../../../lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdminRole(session.role)) return NextResponse.json({ error: "forbidden", message: "Only admins can create tasks." }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const task = body?.task;
  if (!task || !task.id || !task.title) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await createTaskInBoard(task);
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[board/tasks POST]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}

// Full replace of the tasks array — deliberately separate from the routine per-task
// endpoints above. Used ONLY for explicit "Import JSON backup" restores, an admin-only,
// one-off action where wholesale replacement is exactly what's intended.
export async function PUT(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdminRole(session.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const tasks = body?.tasks;
  if (!Array.isArray(tasks)) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await saveBoard({ tasks });
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[board/tasks PUT]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
