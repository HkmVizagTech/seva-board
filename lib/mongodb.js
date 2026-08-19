import { MongoClient } from "mongodb";
import crypto from "crypto";

// Different platforms name the Mongo connection string differently — Railway's own
// MongoDB template exposes it as MONGO_URL, not MONGODB_URI. Accept the common variants
// so a naming mismatch doesn't silently break the whole app.
const uri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGO_PUBLIC_URL ||
  process.env.DATABASE_URL;
const dbName = process.env.MONGODB_DB || "sevaboard";

if (!uri) {
  console.warn("[mongodb] No connection string found in MONGODB_URI, MONGO_URL, MONGO_PUBLIC_URL, or DATABASE_URL.");
}

// Reuse the client across hot-reloads / lambda invocations.
let cached = global._sevaMongo;
if (!cached) cached = global._sevaMongo = { client: null, promise: null };

async function getClient() {
  if (!uri) throw new Error("No MongoDB connection string set (checked MONGODB_URI, MONGO_URL, MONGO_PUBLIC_URL, DATABASE_URL)");
  if (cached.client) return cached.client;
  if (!cached.promise) cached.promise = new MongoClient(uri).connect();
  cached.client = await cached.promise;
  return cached.client;
}

const coll = async () => (await getClient()).db(dbName).collection("board");
const msAuthColl = async () => (await getClient()).db(dbName).collection("msauth");
const usersColl = async () => (await getClient()).db(dbName).collection("users");
const sessionsColl = async () => (await getClient()).db(dbName).collection("sessions");
const pushColl = async () => (await getClient()).db(dbName).collection("pushsubs");

/* ---- push notification subscriptions ---- */
// One document per browser/device subscription, keyed by its endpoint URL (unique per
// device+browser), with the owning user's email and linked devotee id so we can target
// notifications at whoever a task is actually assigned to.
export async function savePushSubscription({ subscription, email, memberId }) {
  await (await pushColl()).updateOne(
    { _id: subscription.endpoint },
    { $set: { endpoint: subscription.endpoint, keys: subscription.keys, email, memberId: memberId || null, updatedAt: Date.now() } },
    { upsert: true }
  );
}

export async function deletePushSubscription(endpoint) {
  await (await pushColl()).deleteOne({ _id: endpoint });
}

export async function getPushSubscriptionsForMembers(memberIds) {
  if (!memberIds || !memberIds.length) return [];
  return (await pushColl()).find({ memberId: { $in: memberIds } }).toArray();
}

export async function getPushSubscriptionsForEmails(emails) {
  if (!emails || !emails.length) return [];
  return (await pushColl()).find({ email: { $in: emails } }).toArray();
}

export async function getPushSubscriptionForEndpoint(endpoint) {
  return (await pushColl()).findOne({ _id: endpoint });
}

// The whole board (sevas, members, festivals, tasks) lives in one document.
export async function getBoard() {
  const doc = await (await coll()).findOne({ _id: "main" });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

export async function saveBoard(data) {
  const { _id, ...rest } = data || {};
  await (await coll()).updateOne({ _id: "main" }, { $set: rest }, { upsert: true });
}

// Atomic per-task operations — used for routine task edits instead of replacing the
// whole tasks array, so one client's stale copy of OTHER tasks can never clobber them.
export async function createTaskInBoard(task) {
  await (await coll()).updateOne({ _id: "main" }, { $push: { tasks: task } }, { upsert: true });
}

export async function updateTaskInBoard(taskId, fields) {
  const keys = Object.keys(fields || {});
  if (!keys.length) return;
  const setOps = {};
  for (const k of keys) setOps[`tasks.$[t].${k}`] = fields[k];
  await (await coll()).updateOne(
    { _id: "main" },
    { $set: setOps },
    { arrayFilters: [{ "t.id": taskId }] }
  );
}

export async function deleteTaskFromBoard(taskId) {
  await (await coll()).updateOne({ _id: "main" }, { $pull: { tasks: { id: taskId } } });
}

// The connected Microsoft (Outlook) account used to send assignment emails.
// Single document for now — whoever last completed "Connect Outlook" is the sender.
export async function getMsAuthDoc() {
  const doc = await (await msAuthColl()).findOne({ _id: "main" });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

export async function saveMsAuthDoc(data) {
  await (await msAuthColl()).updateOne({ _id: "main" }, { $set: data }, { upsert: true });
}

export async function clearMsAuthDoc() {
  await (await msAuthColl()).deleteOne({ _id: "main" });
}

// The connected Gmail account used to send assignment emails (personal sign-in, as
// opposed to the shared GMAIL_USER/GMAIL_APP_PASSWORD mailbox in lib/googleMail.js).
// Single document for now — whoever last completed "Connect Gmail" is the sender.
const googleAuthColl = async () => (await getClient()).db(dbName).collection("googleauth");

export async function getGoogleAuthDoc() {
  const doc = await (await googleAuthColl()).findOne({ _id: "main" });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

export async function saveGoogleAuthDoc(data) {
  await (await googleAuthColl()).updateOne({ _id: "main" }, { $set: data }, { upsert: true });
}

export async function clearGoogleAuthDoc() {
  await (await googleAuthColl()).deleteOne({ _id: "main" });
}

/* ---- logins & sessions ---- */
let indexesEnsured = false;
async function ensureIndexes() {
  if (indexesEnsured) return;
  try { await (await sessionsColl()).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); } catch (e) {}
  indexesEnsured = true;
}

// Three tiers: super_admin (owner-level, can grant/revoke admin access) > admin (full board
// management) > member (task updates only). Everything else defaults down to "member".
export function normalizeRole(role) {
  if (role === "super_admin") return "super_admin";
  if (role === "admin") return "admin";
  return "member";
}

export async function countUsers() {
  await ensureIndexes();
  return (await usersColl()).countDocuments();
}

export async function countSuperAdmins() {
  await ensureIndexes();
  return (await usersColl()).countDocuments({ role: "super_admin" });
}

// One-time migration safety net: promote to super_admin (if none exists yet) when an
// account is either explicitly "admin" (the old admin/member-only system), OR has no
// role field at all — meaning it predates the role system entirely and was never
// explicitly assigned anything. An explicit "member" (added later via Manage → Logins)
// is never auto-promoted. Returns the account's effective role after this check.
export async function resolveEffectiveRole(user) {
  const isLegacyAccount = user.role === undefined;
  let role = user.role || "member";
  if ((role === "admin" || isLegacyAccount) && (await countSuperAdmins()) === 0) {
    await setUserRole(user.email, "super_admin");
    role = "super_admin";
  }
  return role;
}

export async function getUserByEmail(email) {
  await ensureIndexes();
  return (await usersColl()).findOne({ _id: email.toLowerCase() });
}

export async function createUser({ email, passwordHash, name, memberId, role }) {
  await ensureIndexes();
  const _id = email.toLowerCase();
  await (await usersColl()).insertOne({ _id, email: _id, passwordHash, name: name || "", memberId: memberId || null, role: normalizeRole(role), createdAt: Date.now() });
  return _id;
}

export async function setUserPassword(email, passwordHash) {
  await (await usersColl()).updateOne({ _id: email.toLowerCase() }, { $set: { passwordHash } });
}

export async function setUserRole(email, role) {
  await (await usersColl()).updateOne({ _id: email.toLowerCase() }, { $set: { role: normalizeRole(role) } });
}

export async function setUserProfile(email, { name, memberId }) {
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (memberId !== undefined) patch.memberId = memberId || null;
  await (await usersColl()).updateOne({ _id: email.toLowerCase() }, { $set: patch });
  return patch;
}

export async function deleteUser(email) {
  await (await usersColl()).deleteOne({ _id: email.toLowerCase() });
}

export async function listUsers() {
  const docs = await (await usersColl()).find({}, { projection: { passwordHash: 0 } }).toArray();
  return docs.map(({ _id, ...rest }) => rest);
}

export async function createSession({ email, name, memberId, role }) {
  await ensureIndexes();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await (await sessionsColl()).insertOne({ _id: token, email, name: name || "", memberId: memberId || null, role: normalizeRole(role), createdAt: new Date(), expiresAt });
  return token;
}

export async function getSession(token) {
  if (!token) return null;
  const doc = await (await sessionsColl()).findOne({ _id: token });
  if (!doc) return null;
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now()) return null;
  return doc;
}

export async function deleteSession(token) {
  if (!token) return;
  await (await sessionsColl()).deleteOne({ _id: token });
}

export async function updateSessionByToken(token, patch) {
  if (!token) return;
  await (await sessionsColl()).updateOne({ _id: token }, { $set: patch });
}
