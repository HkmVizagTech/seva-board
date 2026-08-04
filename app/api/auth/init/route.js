import { NextResponse } from "next/server";
import { countUsers } from "../../../../lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const total = await countUsers();
    return NextResponse.json({ needsSetup: total === 0 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ needsSetup: false, error: "db_error" }, { status: 500 });
  }
}
