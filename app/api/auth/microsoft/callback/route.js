import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "../../../../../lib/msDelegatedAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const origin = process.env.APP_BASE_URL || url.origin;
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (oauthError) return NextResponse.redirect(`${origin}/?ms_connect=error&reason=${encodeURIComponent(oauthError)}`);
  if (!code) return NextResponse.redirect(`${origin}/?ms_connect=error&reason=no_code`);

  try {
    const redirectUri = `${origin}/api/auth/microsoft/callback`;
    const { email } = await exchangeCodeForTokens(code, redirectUri);
    return NextResponse.redirect(`${origin}/?ms_connect=ok&email=${encodeURIComponent(email)}`);
  } catch (e) {
    console.error("[ms-oauth-callback]", e.message || e);
    return NextResponse.redirect(`${origin}/?ms_connect=error&reason=${encodeURIComponent(e.message || "exchange_failed")}`);
  }
}
