import { MongoClient } from "mongodb";
import crypto from "crypto";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "sevaboard";

// Reuse the client across hot-reloads / lambda invocations.
let cached = global._sevaMongo;
if (!cached) cached = global._sevaMongo = { client: null, promise: null };

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (cached.client) return cached.client;
  if (!cached.promise) cached.promise = new MongoClient(uri).connect();
  cached.client = await cached.promise;
  return cached.client;
}

const coll = async () => (await getClient()).db(dbName).collection("board");
const msAuthColl = async () => (await getClient()).db(dbName).collection("msauth");
const usersColl = async () => (await getClient()).db(dbName).collection("users");
const sessionsColl = async () => (await getClient()).db(dbName).collection("sessions");

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

/* ---- logins & sessions ---- */
let indexesEnsured = false;
async function ensureIndexes() {
  if (indexesEnsured) return;
  try { await (await sessionsColl()).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); } catch (e) {}
  indexesEnsured = true;
}

export async function countUsers() {
  await ensureIndexes();
  return (await usersColl()).countDocuments();
}

export async function getUserByEmail(email) {
  await ensureIndexes();
  return (await usersColl()).findOne({ _id: email.toLowerCase() });
}

export async function createUser({ email, passwordHash, name, memberId }) {
  await ensureIndexes();
  const _id = email.toLowerCase();
  await (await usersColl()).insertOne({ _id, email: _id, passwordHash, name: name || "", memberId: memberId || null, createdAt: Date.now() });
  return _id;
}

export async function setUserPassword(email, passwordHash) {
  await (await usersColl()).updateOne({ _id: email.toLowerCase() }, { $set: { passwordHash } });
}

export async function deleteUser(email) {
  await (await usersColl()).deleteOne({ _id: email.toLowerCase() });
}

export async function listUsers() {
  const docs = await (await usersColl()).find({}, { projection: { passwordHash: 0 } }).toArray();
  return docs.map(({ _id, ...rest }) => rest);
}

export async function createSession({ email, name, memberId }) {
  await ensureIndexes();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await (await sessionsColl()).insertOne({ _id: token, email, name: name || "", memberId: memberId || null, createdAt: new Date(), expiresAt });
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
