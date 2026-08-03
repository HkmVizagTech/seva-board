import { NextResponse } from "next/server";
import { buildAuthorizeUrl, delegatedAuthConfigured } from "../../../../lib/msDelegatedAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!delegatedAuthConfigured()) {
    return NextResponse.json({ error: "not_configured", message: "Set MS_CLIENT_ID and MS_CLIENT_SECRET first." }, { status: 501 });
  }
  const origin = process.env.APP_BASE_URL || new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/microsoft/callback`;
  return NextResponse.redirect(buildAuthorizeUrl(redirectUri));
}
