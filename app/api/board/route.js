import { NextResponse } from "next/server";
import { getBoard, saveBoard } from "../../../lib/mongodb";
import { currentSession } from "../../../lib/authGuard";

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
  if (!(await currentSession(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_body" }, { status: 400 });
    await saveBoard({
      sevas: body.sevas || [],
      members: body.members || [],
      festivals: body.festivals || [],
      tasks: body.tasks || [],
      updatedAt: Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
