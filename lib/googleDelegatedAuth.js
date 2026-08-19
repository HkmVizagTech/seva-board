// "Connect Gmail" — delegated OAuth (authorization code + refresh token). A person signs
// into their own Google account and approves sending mail as themselves, as opposed to
// lib/googleMail.js which sends through one fixed shared mailbox (GMAIL_USER) via SMTP
// with an app password.
//
// Requires a Google Cloud project with an OAuth 2.0 Client ID (Web application) — see
// README.md for the exact setup steps.

import { getGoogleAuthDoc, saveGoogleAuthDoc, clearGoogleAuthDoc } from "./mongodb";

const SCOPES = "https://www.googleapis.com/auth/gmail.send openid email profile";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export function delegatedAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildAuthorizeUrl(redirectUri, state) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent select_account", // "consent" ensures a refresh_token even on re-auth
    include_granted_scopes: "true",
    state: state || "",
  });
  return `${AUTH_URL}?${p.toString()}`;
}

async function requestToken(params) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "token_request_failed");
  return data;
}

export async function exchangeCodeForTokens(code, redirectUri) {
  const data = await requestToken(new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }));

  const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const me = await meRes.json();
  const email = me.email || "unknown";
  const name = me.name || "";

  if (!data.refresh_token) {
    // Google only issues a refresh_token on first consent (or with prompt=consent). If
    // this ever fires, the account likely already had a grant without offline access.
    throw new Error("no_refresh_token — try disconnecting any prior grant at myaccount.google.com/permissions and reconnecting");
  }

  await saveGoogleAuthDoc({
    email, name,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 60, 60) * 1000,
    connectedAt: Date.now(),
  });
  return { email, name };
}

async function refresh(doc) {
  const data = await requestToken(new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: doc.refreshToken,
  }));
  const updated = {
    ...doc,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || doc.refreshToken, // Google doesn't always rotate this
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 60, 60) * 1000,
  };
  await saveGoogleAuthDoc(updated);
  return updated;
}

async function getValidTokenDoc() {
  const doc = await getGoogleAuthDoc();
  if (!doc) return null;
  if (doc.expiresAt > Date.now()) return doc;
  return await refresh(doc);
}

export async function getDelegatedStatus() {
  const doc = await getGoogleAuthDoc();
  if (!doc) return { connected: false };
  return { connected: true, email: doc.email, name: doc.name, connectedAt: doc.connectedAt };
}

export async function disconnectDelegated() {
  await clearGoogleAuthDoc();
}

function buildRawMessage({ from, to, subject, html }) {
  // Gmail's API wants a full RFC 2822 message, base64url-encoded.
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ];
  const raw = Buffer.from(lines.join("\r\n"), "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return raw;
}

export async function sendDelegatedMail({ to, subject, html }) {
  const doc = await getValidTokenDoc();
  if (!doc) throw new Error("not_connected");

  const raw = buildRawMessage({ from: doc.email, to, subject, html });
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${doc.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (res.ok) return { ok: true };
  const detail = await res.text();
  throw new Error(`Gmail send failed (${res.status}): ${detail}`);
}
