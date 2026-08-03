// Fallback mail provider. Used only if Microsoft Graph isn't configured
// (see lib/msGraph.js), so switching providers is just an env-var change.

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendResendMail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Seva Board <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (res.ok) return { ok: true };
  const detail = await res.text();
  throw new Error(`Resend send failed (${res.status}): ${detail}`);
}
