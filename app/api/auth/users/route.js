import { NextResponse } from "next/server";
import { listUsers, getUserByEmail, createUser, setUserPassword, deleteUser } from "../../../../lib/mongodb";
import { hashPassword } from "../../../../lib/passwords";
import { currentSession } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try { return NextResponse.json({ users: await listUsers() }); }
  catch (e) { console.error(e); return NextResponse.json({ error: "db_error" }, { status: 500 }); }
}

export async function POST(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  if (!email || !password) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  try {
    const existing = await getUserByEmail(email);
    if (existing) return NextResponse.json({ error: "already_exists" }, { status: 409 });
    const passwordHash = await hashPassword(password);
    await createUser({ email, passwordHash, name, memberId: body.memberId || null });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  try {
    const passwordHash = await hashPassword(password);
    await setUserPassword(email, passwordHash);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await deleteUser(email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
