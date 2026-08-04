import { NextResponse } from "next/server";
import { listUsers, getUserByEmail, createUser, setUserPassword, setUserRole, deleteUser } from "../../../../lib/mongodb";
import { hashPassword } from "../../../../lib/passwords";
import { currentSession } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req) {
  const session = await currentSession(req);
  if (!session) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (session.role !== "admin") return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;
  try { return NextResponse.json({ users: await listUsers() }); }
  catch (e) { console.error(e); return NextResponse.json({ error: "db_error" }, { status: 500 }); }
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const role = body.role === "admin" ? "admin" : "member";
  if (!email || !password) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  try {
    const existing = await getUserByEmail(email);
    if (existing) return NextResponse.json({ error: "already_exists" }, { status: 409 });
    const passwordHash = await hashPassword(password);
    await createUser({ email, passwordHash, name, memberId: body.memberId || null, role });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

// PUT handles two actions: password reset (password provided) and/or role change (role provided).
export async function PUT(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    if (body.password) {
      const password = String(body.password);
      if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });
      await setUserPassword(email, await hashPassword(password));
    }
    if (body.role) {
      await setUserRole(email, body.role === "admin" ? "admin" : "member");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

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
