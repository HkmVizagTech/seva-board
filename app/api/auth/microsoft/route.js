import { NextResponse } from "next/server";
import { buildAuthorizeUrl, delegatedAuthConfigured } from "../../../../lib/msDelegatedAuth";
import { currentSession, isAdminRole } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const origin = process.env.APP_BASE_URL || new URL(req.url).origin;
  const session = await currentSession(req);
  if (!session) return NextResponse.redirect(`${origin}/?ms_connect=error&reason=login_required`);
  if (!isAdminRole(session.role)) return NextResponse.redirect(`${origin}/?ms_connect=error&reason=admin_required`);
  if (!delegatedAuthConfigured()) {
    return NextResponse.json({ error: "not_configured", message: "Set MS_CLIENT_ID and MS_CLIENT_SECRET first." }, { status: 501 });
  }
  const redirectUri = `${origin}/api/auth/microsoft/callback`;
  return NextResponse.redirect(buildAuthorizeUrl(redirectUri));
}
