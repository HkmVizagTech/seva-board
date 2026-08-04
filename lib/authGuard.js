import { getSession } from "./mongodb";

const COOKIE = "sb_session";

// Works with NextRequest (route handlers) which exposes req.cookies.get(name).
export async function currentSession(req) {
  const token = req.cookies?.get ? req.cookies.get(COOKIE)?.value : null;
  if (!token) return null;
  try { return await getSession(token); } catch (e) { return null; }
}

// Admin and super_admin both get full board-management access; only super_admin can
// grant/revoke admin access itself or touch other admin-tier accounts.
export function isAdminRole(role) {
  return role === "admin" || role === "super_admin";
}

export const SESSION_COOKIE = COOKIE;
