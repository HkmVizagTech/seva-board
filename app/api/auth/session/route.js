import { NextResponse } from "next/server";
import { currentSession } from "../../../../lib/authGuard";
import { getUserByEmail, updateSessionByToken, resolveEffectiveRole } from "../../../../lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ authenticated: false });

  // Reconcile against the live user record on every check, so role/name/memberId changes —
  // including the super_admin migration — take effect on the very next page load, without
  // needing an explicit sign-out/sign-in.
  let { role, name, memberId } = session;
  role = role || "member";
  try {
    const user = await getUserByEmail(session.email);
    if (user) {
      const freshRole = await resolveEffectiveRole(user);
      const changed = freshRole !== role || user.name !== name || user.memberId !== memberId;
      role = freshRole; name = user.name || name; memberId = user.memberId;
      if (changed) await updateSessionByToken(session._id, { role, name, memberId });
    }
  } catch (e) { console.error("[auth/session reconcile]", e.message || e); }

  return NextResponse.json({ authenticated: true, email: session.email, name, memberId, role });
}
