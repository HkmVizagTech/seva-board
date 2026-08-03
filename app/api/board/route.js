import { NextResponse } from "next/server";
import { getBoard, saveBoard } from "../../../lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// If BOARD_PASSWORD is set, every request must carry a matching x-board-pass header.
// If it's empty/unset, the board is open (put it behind Coolify/Cloudflare Access instead).
function authorized(req) {
  const need = process.env.BOARD_PASSWORD;
  if (!need) return true;
  return req.headers.get("x-board-pass") === need;
}

export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const board = await getBoard();
    return NextResponse.json(board);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
