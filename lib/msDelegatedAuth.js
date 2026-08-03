// "Connect Outlook" — delegated OAuth (authorization code + refresh token), as opposed
// to lib/msGraph.js which is the app-only (client credentials) flow requiring org-wide
// admin consent up front. Here, a person signs into their own Microsoft account and
// approves sending mail as themselves — no admin step needed if the tenant allows
// self-consent for this scope.
//
// Uses the SAME Azure AD app registration as lib/msGraph.js (MS_CLIENT_ID / MS_CLIENT_SECRET),
// just with a Web redirect URI added and Mail.Send requested as a *delegated* permission
// instead of (or alongside) the application permission.

import { getMsAuthDoc, saveMsAuthDoc, clearMsAuthDoc } from "./mongodb";

const SCOPES = "offline_access Mail.Send User.Read";
const tenant = () => process.env.MS_TENANT_ID || "common";
const authorizeUrl = () => `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize`;
const tokenUrl = () => `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`;

export function delegatedAuthConfigured() {
  return Boolean(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
}

export function buildAuthorizeUrl(redirectUri, state) {
  const p = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: SCOPES,
    prompt: "select_account",
    state: state || "",
  });
  return `${authorizeUrl()}?${p.toString()}`;
}

async function requestToken(params) {
  const res = await fetch(tokenUrl(), {
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
    client_id: process.env.MS_CLIENT_ID,
    client_secret: process.env.MS_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    scope: SCOPES,
  }));

  const meRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const me = await meRes.json();
  const email = me.mail || me.userPrincipalName || "unknown";
  const name = me.displayName || "";

  await saveMsAuthDoc({
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
    client_id: process.env.MS_CLIENT_ID,
    client_secret: process.env.MS_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: doc.refreshToken,
    scope: SCOPES,
  }));
  const updated = {
    ...doc,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || doc.refreshToken, // Microsoft usually rotates this
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 60, 60) * 1000,
  };
  await saveMsAuthDoc(updated);
  return updated;
}

async function getValidTokenDoc() {
  const doc = await getMsAuthDoc();
  if (!doc) return null;
  if (doc.expiresAt > Date.now()) return doc;
  return await refresh(doc);
}

export async function getDelegatedStatus() {
  const doc = await getMsAuthDoc();
  if (!doc) return { connected: false };
  return { connected: true, email: doc.email, name: doc.name, connectedAt: doc.connectedAt };
}

export async function disconnectDelegated() {
  await clearMsAuthDoc();
}

export async function sendDelegatedMail({ to, subject, html }) {
  const doc = await getValidTokenDoc();
  if (!doc) throw new Error("not_connected");

  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${doc.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: { subject, body: { contentType: "HTML", content: html }, toRecipients: [{ emailAddress: { address: to } }] },
      saveToSentItems: true,
    }),
  });
  if (res.status === 202 || res.ok) return { ok: true };
  const detail = await res.text();
  throw new Error(`Delegated sendMail failed (${res.status}): ${detail}`);
}
