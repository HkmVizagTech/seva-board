import { NextResponse } from "next/server";
import { listBackups, getBackupBoard, snapshotBoard, saveBoard } from "../../../../lib/mongodb";
import { currentSession } from "../../../../lib/authGuard";
import { broadcast } from "../../../../lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Restoring overwrites the live board, so this is super-admin only.
async function requireSuper(req) {
  const session = await currentSession(req);
  if (!session) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (session.role !== "super_admin") return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET(req) {
  const { error } = await requireSuper(req);
  if (error) return error;
  try { return NextResponse.json({ backups: await listBackups() }); }
  catch (e) { console.error("[backups GET]", e.message || e); return NextResponse.json({ error: "db_error" }, { status: 500 }); }
}

export async function POST(req) {
  const { error } = await requireSuper(req);
  if (error) return error;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }

  try {
    if (body?.create) {
      await snapshotBoard("manual backup", 0);
      return NextResponse.json({ ok: true });
    }
    if (!body?.id) return NextResponse.json({ error: "bad_body" }, { status: 400 });
    const board = await getBackupBoard(String(body.id));
    if (!board) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await snapshotBoard("before restore", 0); // so a restore can itself be undone
    await saveBoard({
      sevas: board.sevas || [], members: board.members || [], festivals: board.festivals || [], tasks: board.tasks || [],
      updatedAt: Date.now(),
    });
    broadcast({ type: "board_updated" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[backups POST]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
