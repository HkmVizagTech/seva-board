import { NextResponse } from "next/server";
import { countUsers, getUserByEmail, createUser, createSession } from "../../../../lib/mongodb";
import { hashPassword, verifyPassword } from "../../../../lib/passwords";
import { SESSION_COOKIE } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function setSessionCookie(res, token) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  try {
    const total = await countUsers();

    if (total === 0) {
      // Bootstrap: create the very first account. If BOARD_PASSWORD is set, require it as an
      // extra one-time setup passphrase so a stranger can't grab the first account first.
      const need = process.env.BOARD_PASSWORD;
      if (need && body.setupPassword !== need) {
        return NextResponse.json({ error: "setup_password_required" }, { status: 401 });
      }
      const name = String(body.name || "").trim() || email.split("@")[0];
      const passwordHash = await hashPassword(password);
      await createUser({ email, passwordHash, name, memberId: body.memberId || null });
      const token = await createSession({ email, name, memberId: body.memberId || null });
      const res = NextResponse.json({ ok: true, created: true, email, name, memberId: body.memberId || null });
      setSessionCookie(res, token);
      return res;
    }

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

    const token = await createSession({ email: user.email, name: user.name, memberId: user.memberId });
    const res = NextResponse.json({ ok: true, email: user.email, name: user.name, memberId: user.memberId });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error("[auth/login]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
