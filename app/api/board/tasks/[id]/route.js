import { NextResponse } from "next/server";
import { updateTaskInBoard, deleteTaskFromBoard } from "../../../../../lib/mongodb";
import { currentSession, isAdminRole } from "../../../../../lib/authGuard";
import { broadcast } from "../../../../../lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fields a member is ever allowed to change on an existing task. Everything else
// (title, notes, sevaId, festivalId, assigneeIds, priority, due, recurrence, ...) is
// admin-only and silently dropped from a member's request rather than applied.
const MEMBER_EDITABLE_TASK_FIELDS = ["status", "subtasks", "comments", "history", "completedAt"];

export async function PATCH(req, { params }) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  let fields = body?.fields;
  if (!fields || typeof fields !== "object") return NextResponse.json({ error: "bad_body" }, { status: 400 });

  if (!isAdminRole(session.role)) {
    const filtered = {};
    for (const key of MEMBER_EDITABLE_TASK_FIELDS) if (key in fields) filtered[key] = fields[key];
    fields = filtered;
  }
  if (!Object.keys(fields).length) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await updateTaskInBoard(params.id, fields);
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[board/tasks/:id PATCH]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdminRole(session.role)) return NextResponse.json({ error: "forbidden", message: "Only admins can delete tasks." }, { status: 403 });

  try {
    await deleteTaskFromBoard(params.id);
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[board/tasks/:id DELETE]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
