import { NextResponse } from "next/server";
import { pingDb } from "../../../lib/mongodb";

// Deliberately unauthenticated. Railway's healthcheck uses the plain form (never touches the
// database, so a brief DB blip can't make Railway restart the app). Uptime monitors can use
// /api/health?deep=1, which also checks the database and returns 503 if it's unreachable.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!new URL(req.url).searchParams.get("deep")) return NextResponse.json({ status: "ok" });
  try { await pingDb(); return NextResponse.json({ status: "ok", db: "up" }); }
  catch (e) { return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 }); }
}
