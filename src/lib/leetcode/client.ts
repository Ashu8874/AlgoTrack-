import "server-only";

import { env } from "@/lib/env";
import {
  LeetCodeGraphQLError,
  LeetCodeNetworkError,
  LeetCodeNotFoundError,
} from "./errors";
import type { LeetCodeTopLevelGraphQLResponse } from "./types";

const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 15000;

type GraphQLRequestOptions = {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status?: number) {
  return !status || status === 429 || status >= 500;
}

async function fetchWithRetry<T>({
  operationName,
  query,
  variables,
}: GraphQLRequestOptions): Promise<LeetCodeTopLevelGraphQLResponse<T>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(env.LEETCODE_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          origin: "https://leetcode.com",
          referer: "https://leetcode.com",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          operationName,
          query,
          variables,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        if (shouldRetry(response.status) && attempt < DEFAULT_RETRY_ATTEMPTS) {
          await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
          continue;
        }

        throw new LeetCodeNetworkError(
          `LeetCode request failed with status ${response.status}`,
          bodyText,
        );
      }

      const payload = (await response.json()) as LeetCodeTopLevelGraphQLResponse<T>;
      if (payload.errors?.length) {
        const messages = payload.errors.map((error) => error.message);
        throw new LeetCodeGraphQLError(
          `LeetCode GraphQL query "${operationName}" failed`,
          messages,
        );
      }

      return payload;
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const status = error instanceof LeetCodeNetworkError ? error.statusCode : undefined;

      if ((isAbort || shouldRetry(status)) && attempt < DEFAULT_RETRY_ATTEMPTS) {
        await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
        continue;
      }

      if (error instanceof LeetCodeGraphQLError || error instanceof LeetCodeNetworkError) {
        throw error;
      }

      throw new LeetCodeNetworkError(`LeetCode request failed for "${operationName}"`, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new LeetCodeNetworkError(`LeetCode request failed for "${operationName}"`, lastError);
}

export async function executeLeetCodeGraphQL<T>({
  operationName,
  query,
  variables,
}: GraphQLRequestOptions): Promise<T> {
  const payload = await fetchWithRetry<T>({ operationName, query, variables });
  if (!payload.data) {
    throw new LeetCodeNetworkError(`LeetCode GraphQL query "${operationName}" returned no data`);
  }

  return payload.data;
}

export { LeetCodeNotFoundError };
