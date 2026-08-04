import { NextResponse } from "next/server";
import { listUsers, getUserByEmail, createUser, setUserPassword, setUserRole, deleteUser, normalizeRole } from "../../../../lib/mongodb";
import { hashPassword } from "../../../../lib/passwords";
import { currentSession, isAdminRole } from "../../../../lib/authGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(req) {
  const session = await currentSession(req);
  if (!session) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!isAdminRole(session.role)) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { session };
}

// Only a super_admin may grant admin-tier access or touch an existing admin-tier account.
// A regular admin can freely manage member accounts only.
const ADMIN_TIERS = ["admin", "super_admin"];

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;
  try { return NextResponse.json({ users: await listUsers() }); }
  catch (e) { console.error(e); return NextResponse.json({ error: "db_error" }, { status: 500 }); }
}

export async function POST(req) {
  const { session, error } = await requireAdmin(req);
  if (error) return error;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const requestedRole = normalizeRole(body.role);
  if (!email || !password) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  if (ADMIN_TIERS.includes(requestedRole) && session.role !== "super_admin") {
    return NextResponse.json({ error: "forbidden", message: "Only the super admin can grant admin access." }, { status: 403 });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) return NextResponse.json({ error: "already_exists" }, { status: 409 });
    const passwordHash = await hashPassword(password);
    await createUser({ email, passwordHash, name, memberId: body.memberId || null, role: requestedRole });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

// PUT handles two actions: password reset (password provided) and/or role change (role provided).
export async function PUT(req) {
  const { session, error } = await requireAdmin(req);
  if (error) return error;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    const target = await getUserByEmail(email);
    if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // A regular admin can't touch an existing admin/super_admin account at all —
    // not the password, not the role — only a super_admin can.
    if (ADMIN_TIERS.includes(target.role) && session.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden", message: "Only the super admin can manage other admin accounts." }, { status: 403 });
    }
    if (body.role && ADMIN_TIERS.includes(normalizeRole(body.role)) && session.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden", message: "Only the super admin can grant admin access." }, { status: 403 });
    }

    if (body.password) {
      const password = String(body.password);
      if (password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });
      await setUserPassword(email, await hashPassword(password));
    }
    if (body.role) {
      await setUserRole(email, body.role);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { session, error } = await requireAdmin(req);
  if (error) return error;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_body" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    const target = await getUserByEmail(email);
    if (target && ADMIN_TIERS.includes(target.role) && session.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden", message: "Only the super admin can remove other admin accounts." }, { status: 403 });
    }
    await deleteUser(email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
