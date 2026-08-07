import { NextResponse } from "next/server";
import { getPushSubscriptionsForMembers } from "../../../../lib/mongodb";
import { pushConfigured, sendPushToSubscriptions } from "../../../../lib/webPush";
import { currentSession, isAdminRole } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdminRole(session.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!pushConfigured()) return NextResponse.json({ error: "push_not_configured" }, { status: 501 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const { memberIds, title, seva, due } = body || {};
  if (!Array.isArray(memberIds) || !memberIds.length || !title) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    const subs = await getPushSubscriptionsForMembers(memberIds);
    if (!subs.length) return NextResponse.json({ ok: true, sent: 0, note: "no_subscribed_devices" });

    const parts = [];
    if (seva) parts.push(seva);
    if (due) parts.push(`due ${due}`);

    const result = await sendPushToSubscriptions(subs, {
      title: "New seva assigned 🙏",
      body: parts.length ? `${title} — ${parts.join(" · ")}` : title,
      tag: "seva-assigned",
      url: "/",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[push/notify]", e.message || e);
    return NextResponse.json({ error: "send_failed", message: String(e.message || e) }, { status: 500 });
  }
}
