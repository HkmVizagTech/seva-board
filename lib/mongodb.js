import { MongoClient } from "mongodb";

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
