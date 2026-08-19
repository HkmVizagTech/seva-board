import { NextResponse } from "next/server";
import { buildAuthorizeUrl, delegatedAuthConfigured } from "../../../../lib/googleDelegatedAuth";
import { currentSession, isAdminRole } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const origin = process.env.APP_BASE_URL || new URL(req.url).origin;
  const session = await currentSession(req);
  if (!session) return NextResponse.redirect(`${origin}/?google_connect=error&reason=login_required`);
  if (!isAdminRole(session.role)) return NextResponse.redirect(`${origin}/?google_connect=error&reason=admin_required`);
  if (!delegatedAuthConfigured()) {
    return NextResponse.json({ error: "not_configured", message: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first." }, { status: 501 });
  }
  const redirectUri = `${origin}/api/auth/google/callback`;
  return NextResponse.redirect(buildAuthorizeUrl(redirectUri));
}
