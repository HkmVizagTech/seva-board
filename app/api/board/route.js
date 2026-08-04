import { NextResponse } from "next/server";
import { getBoard, saveBoard } from "../../../lib/mongodb";
import { currentSession, isAdminRole } from "../../../lib/authGuard";
import { broadcast } from "../../../lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fields a member is ever allowed to change on an existing task. Everything else
// (title, notes, sevaId, festivalId, assigneeIds, priority, due, recurrence, ...) is
// admin-only and silently preserved from the database, never taken from the client.
const MEMBER_EDITABLE_TASK_FIELDS = ["status", "subtasks", "comments", "history", "completedAt"];

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

    let sevas = body.sevas || [];
    let members = body.members || [];
    let festivals = body.festivals || [];
    let tasks = body.tasks || [];

    if (!isAdminRole(session.role)) {
      // Never trust a member's copy of admin-managed data — always use what's actually in
      // the database. (Previously this compared-and-rejected with a 403 if their copy was
      // merely stale, which happens routinely with real-time sync; now it just silently
      // uses the authoritative version instead of erroring or, worse, overwriting it.)
      const existing = (await getBoard()) || {};
      sevas = existing.sevas || [];
      members = existing.members || [];
      festivals = existing.festivals || [];

      // Same principle for tasks, at the field level: start from the database's tasks
      // (so a member's stale local copy can never silently delete a task added by someone
      // else since their last refresh), and only fold in the whitelisted fields they're
      // actually allowed to change, for tasks they already have locally.
      const existingTasks = existing.tasks || [];
      const incomingById = Object.fromEntries(tasks.map((t) => [t.id, t]));
      tasks = existingTasks.map((prevTask) => {
        const incomingTask = incomingById[prevTask.id];
        if (!incomingTask) return prevTask;
        const merged = { ...prevTask };
        for (const key of MEMBER_EDITABLE_TASK_FIELDS) if (key in incomingTask) merged[key] = incomingTask[key];
        return merged;
      });
    }

    await saveBoard({ sevas, members, festivals, tasks, updatedAt: Date.now() });
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
