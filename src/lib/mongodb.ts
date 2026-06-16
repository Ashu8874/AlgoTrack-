import { MongoClient, type Db } from "mongodb";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;

  if (!clientPromise) {
    client = new MongoClient(env.MONGODB_URI);
    clientPromise = client.connect();
  }

  client = await clientPromise;
  return client;
}

export async function getMongoDb(): Promise<Db> {
  const mongoClient = await getMongoClient();
  return mongoClient.db(env.MONGODB_DB);
}
