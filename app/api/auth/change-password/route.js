import { NextResponse } from "next/server";
import { getUserByEmail, setUserPassword } from "../../../../lib/mongodb";
import { hashPassword, verifyPassword } from "../../../../lib/passwords";
import { currentSession } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  if (!currentPassword || !newPassword) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  if (newPassword.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  try {
    const user = await getUserByEmail(session.email);
    if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "invalid_current_password" }, { status: 401 });
    await setUserPassword(session.email, await hashPassword(newPassword));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/change-password]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
