import { NextResponse } from "next/server";
import { setUserProfile, updateSessionByToken } from "../../../../lib/mongodb";
import { currentSession } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }

  const patch = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if ("memberId" in body) patch.memberId = body.memberId || null;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await setUserProfile(session.email, patch);
    // Keep the current session in sync so the change shows immediately without re-login.
    await updateSessionByToken(session._id, patch);
    return NextResponse.json({ ok: true, ...patch });
  } catch (e) {
    console.error("[auth/me]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}
