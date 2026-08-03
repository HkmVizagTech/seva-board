import { NextResponse } from "next/server";
import { getMsAuthDoc } from "../../../lib/mongodb";
import { sendDelegatedMail } from "../../../lib/msDelegatedAuth";
import { graphConfigured, sendGraphMail } from "../../../lib/msGraph";
import { resendConfigured, sendResendMail } from "../../../lib/resendMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req) {
  const need = process.env.BOARD_PASSWORD;
  if (!need) return true;
  return req.headers.get("x-board-pass") === need;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export async function POST(req) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const { to, name, title, notes, seva, due, priority } = body || {};
  if (!to || !title) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  const safeName = escapeHtml(name || "");
  const safeTitle = escapeHtml(title);
  const safeSeva = escapeHtml(seva || "");
  const safeNotes = escapeHtml(notes || "");
  const dueLine = due ? `<p style="margin:4px 0 0;color:#6E664F;font-size:13px;"><strong>Due:</strong> ${escapeHtml(due)}</p>` : "";
  const prLine = priority && priority !== "normal" ? `<p style="margin:4px 0 0;color:#A83232;font-size:13px;font-weight:700;text-transform:uppercase;">${escapeHtml(priority)}</p>` : "";

  const html = `
  <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:28px;background:#F7F1E3;border-radius:14px;">
    <h2 style="color:#20233F;margin:0 0 6px;">Hare Krishna${safeName ? " " + safeName : ""} 🙏</h2>
    <p style="color:#20233F;margin:0 0 14px;">A new seva has been assigned to you on the Seva Board:</p>
    <div style="background:#FFFDF7;border-left:4px solid #E08A1E;border-radius:8px;padding:14px 16px;">
      <h3 style="margin:0 0 6px;color:#20233F;font-size:17px;">${safeTitle}</h3>
      ${safeSeva ? `<p style="margin:0;color:#6E664F;font-size:13px;">Seva: ${safeSeva}</p>` : ""}
      ${dueLine}${prLine}
      ${safeNotes ? `<p style="margin:10px 0 0;color:#20233F;font-size:14px;line-height:1.5;">${safeNotes}</p>` : ""}
    </div>
    <p style="color:#6E664F;font-size:12.5px;margin-top:18px;">— Seva Board, Hare Krishna Movement Visakhapatnam</p>
  </div>`;

  const subject = `Seva assigned: ${title}`;

  // Prefer a connected Outlook account (sign-in flow) → app-only Graph → Resend → not configured.
  const delegatedDoc = await getMsAuthDoc().catch(() => null);
  const provider = delegatedDoc ? "microsoft-delegated" : graphConfigured() ? "microsoft-apponly" : resendConfigured() ? "resend" : null;
  if (!provider) return NextResponse.json({ error: "email_not_configured" }, { status: 501 });

  try {
    if (provider === "microsoft-delegated") await sendDelegatedMail({ to, subject, html });
    else if (provider === "microsoft-apponly") await sendGraphMail({ to, subject, html });
    else await sendResendMail({ to, subject, html });
    return NextResponse.json({ ok: true, provider });
  } catch (e) {
    console.error(`[notify:${provider}]`, e.message || e);
    return NextResponse.json({ error: "send_failed", provider }, { status: 502 });
  }
}
