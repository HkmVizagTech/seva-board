// Sends mail through Microsoft Graph using an Azure AD app-only (client credentials) token.
// The app authenticates as itself (no per-user login) and sends mail "as" one mailbox —
// e.g. seva@harekrishnavizag.org — via POST /users/{mailbox}/sendMail.
//
// Requires an Azure AD app registration with the *Application* permission Mail.Send,
// granted admin consent. See README.md for the exact setup steps.

const TOKEN_URL = (tenant) => `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
const GRAPH_SENDMAIL = (mailbox) => `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/sendMail`;

// Cache the token across warm invocations (same pattern as lib/mongodb.js).
let cached = global._msGraphToken;
if (!cached) cached = global._msGraphToken = { token: null, expiresAt: 0 };

export function graphConfigured() {
  return Boolean(process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET && process.env.MS_SENDER_EMAIL);
}

async function getToken() {
  const now = Date.now();
  if (cached.token && cached.expiresAt - 60_000 > now) return cached.token;

  const tenant = process.env.MS_TENANT_ID;
  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    client_secret: process.env.MS_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(TOKEN_URL(tenant), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error_description || data?.error || "token_request_failed";
    throw new Error(`Microsoft token error: ${msg}`);
  }
  cached.token = data.access_token;
  cached.expiresAt = now + (data.expires_in || 3600) * 1000;
  return cached.token;
}

export async function sendGraphMail({ to, subject, html }) {
  const token = await getToken();
  const mailbox = process.env.MS_SENDER_EMAIL;

  const res = await fetch(GRAPH_SENDMAIL(mailbox), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });

  if (res.status === 202 || res.ok) return { ok: true };
  const detail = await res.text();
  throw new Error(`Graph sendMail failed (${res.status}): ${detail}`);
}
