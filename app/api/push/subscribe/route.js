import { NextResponse } from "next/server";
import { savePushSubscription, deletePushSubscription, getPushSubscriptionForEndpoint } from "../../../../lib/mongodb";
import { pushConfigured, sendPushToSubscriptions } from "../../../../lib/webPush";
import { currentSession } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tells the client whether push is available and hands over the public VAPID key,
// which the browser needs in order to create a subscription.
export async function GET(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ configured: false });
  return NextResponse.json({ configured: true, publicKey: process.env.VAPID_PUBLIC_KEY });
}

// Register (or refresh) this device's subscription for the logged-in user.
export async function POST(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const subscription = body?.subscription;
  if (!subscription?.endpoint || !subscription?.keys) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await savePushSubscription({ subscription, email: session.email, memberId: session.memberId });

    // Send a confirmation notification so the person immediately sees it working,
    // rather than wondering whether it took effect.
    if (pushConfigured()) {
      const saved = await getPushSubscriptionForEndpoint(subscription.endpoint);
      if (saved) {
        await sendPushToSubscriptions([saved], {
          title: "Notifications are on 🙏",
          body: "You'll be notified here when a seva is assigned to you.",
          tag: "seva-board-welcome",
          url: "/",
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/subscribe]", e.message || e);
    return NextResponse.json({ error: "db_error", message: String(e.message || e) }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await currentSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const endpoint = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    await deletePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/unsubscribe]", e.message || e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
