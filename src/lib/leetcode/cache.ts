import { getRedisClient, invalidateCache } from "@/lib/redis";

const CACHE_TTL_SECONDS = 15 * 60;

export async function getCachedValue<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(key);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

export async function setCachedValue<T>(key: string, value: T, ttlSeconds = CACHE_TTL_SECONDS) {
  try {
    const client = await getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    return null;
  }
}

export function getLeetCodeCacheKey(operation: string, username: string, suffix = "") {
  const normalizedUsername = username.trim().toLowerCase();
  return `leetcode:${operation}:${normalizedUsername}${suffix ? `:${suffix}` : ""}`;
}

export async function invalidateLeetCodeCache(username: string) {
  const normalizedUsername = username.trim().toLowerCase();
  await invalidateCache(`leetcode:*:${normalizedUsername}*`);
}

export const LEETCODE_CACHE_TTL_SECONDS = CACHE_TTL_SECONDS;
