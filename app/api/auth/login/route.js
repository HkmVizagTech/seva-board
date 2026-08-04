import { NextResponse } from "next/server";
import { countUsers, countSuperAdmins, getUserByEmail, createUser, createSession, setUserRole } from "../../../../lib/mongodb";
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
      // The first account is always super_admin — everyone added afterward defaults to member.
      const need = process.env.BOARD_PASSWORD;
      if (need && body.setupPassword !== need) {
        return NextResponse.json({ error: "setup_password_required" }, { status: 401 });
      }
      const name = String(body.name || "").trim() || email.split("@")[0];
      const passwordHash = await hashPassword(password);
      await createUser({ email, passwordHash, name, memberId: body.memberId || null, role: "super_admin" });
      const token = await createSession({ email, name, memberId: body.memberId || null, role: "super_admin" });
      const res = NextResponse.json({ ok: true, created: true, email, name, memberId: body.memberId || null, role: "super_admin" });
      setSessionCookie(res, token);
      return res;
    }

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

    // One-time migration safety net: promote to super_admin (if none exists yet) when this
    // account is either explicitly "admin" (the old admin/member-only system), OR has no
    // role field at all — meaning it predates the role system entirely and was never
    // explicitly assigned anything. An explicit "member" (added later via Manage → Logins)
    // is never auto-promoted.
    const isLegacyAccount = user.role === undefined;
    let role = user.role || "member";
    if ((role === "admin" || isLegacyAccount) && (await countSuperAdmins()) === 0) {
      await setUserRole(email, "super_admin");
      role = "super_admin";
    }

    const token = await createSession({ email: user.email, name: user.name, memberId: user.memberId, role });
    const res = NextResponse.json({ ok: true, email: user.email, name: user.name, memberId: user.memberId, role });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error("[auth/login]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
