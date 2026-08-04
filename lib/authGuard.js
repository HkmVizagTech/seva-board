import { getSession } from "./mongodb";

const COOKIE = "sb_session";

// Works with NextRequest (route handlers) which exposes req.cookies.get(name).
export async function currentSession(req) {
  const token = req.cookies?.get ? req.cookies.get(COOKIE)?.value : null;
  if (!token) return null;
  try { return await getSession(token); } catch (e) { return null; }
}

export const SESSION_COOKIE = COOKIE;
