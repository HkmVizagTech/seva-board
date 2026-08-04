import { NextResponse } from "next/server";
import { currentSession } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true, email: session.email, name: session.name, memberId: session.memberId });
}
