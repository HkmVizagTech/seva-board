import { NextResponse } from "next/server";
import { deleteSession } from "../../../../lib/mongodb";
import { SESSION_COOKIE } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) { try { await deleteSession(token); } catch (e) {} }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
