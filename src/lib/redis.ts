import Redis from "ioredis";

let redis: Redis | null = null;

function createClient(): Redis {
  const url = process.env.REDIS_URL;
  if (url) {
    return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  }
  return new Redis({
    host: "127.0.0.1",
    port: 6379,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
}

export async function getRedisClient(): Promise<Redis> {
  if (!redis) {
    redis = createClient();
    redis.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
    });
  }

  try {
    if (redis.status !== "ready" && redis.status !== "connecting") {
      await redis.connect();
    }
  } catch {
    // allow cache misses when Redis is unavailable
  }

  return redis;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttl = 300): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setex(key, ttl, JSON.stringify(value));
  } catch {
    console.warn("[Redis] Failed to cache:", key);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    console.warn("[Redis] Failed to invalidate:", pattern);
  }
}
