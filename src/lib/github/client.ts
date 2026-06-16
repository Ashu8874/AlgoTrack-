import "server-only";

import { env } from "@/lib/env";
import {
  GitHubAuthError,
  GitHubError,
  GitHubRequestError,
  GitHubResponseParseError,
} from "./errors";
import type { GitHubTopLevelGraphQLResponse } from "./types";

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

function assertConfigured() {
  if (!env.GITHUB_TOKEN) {
    throw new GitHubAuthError();
  }
}

async function fetchWithRetry<T>({
  operationName,
  query,
  variables,
}: GraphQLRequestOptions): Promise<GitHubTopLevelGraphQLResponse<T>> {
  assertConfigured();

  let lastError: unknown;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(env.GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `bearer ${env.GITHUB_TOKEN}`,
          "user-agent": "LeetCode Progress Analyzer",
        },
        body: JSON.stringify({
          query,
          operationName,
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

        if (response.status === 401 || response.status === 403) {
          throw new GitHubAuthError(
            `GitHub request failed with status ${response.status}`,
            bodyText,
          );
        }

        throw new GitHubRequestError(
          `GitHub request failed with status ${response.status}`,
          response.status,
          bodyText,
        );
      }

      let payload: GitHubTopLevelGraphQLResponse<T>;
      try {
        payload = (await response.json()) as GitHubTopLevelGraphQLResponse<T>;
      } catch (error) {
        throw new GitHubResponseParseError(
          `GitHub GraphQL query "${operationName}" returned invalid JSON`,
          error,
        );
      }

      if (payload.errors?.length) {
        const messages = payload.errors.map((error) => error.message);
        throw new GitHubError(`GitHub GraphQL query "${operationName}" failed`, 422, messages);
      }

      return payload;
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const status = error instanceof GitHubRequestError ? error.statusCode : undefined;

      if ((isAbort || shouldRetry(status)) && attempt < DEFAULT_RETRY_ATTEMPTS) {
        await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
        continue;
      }

      if (
        error instanceof GitHubError ||
        error instanceof GitHubAuthError ||
        error instanceof GitHubRequestError ||
        error instanceof GitHubResponseParseError
      ) {
        throw error;
      }

      throw new GitHubRequestError(`GitHub request failed for "${operationName}"`, undefined, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new GitHubRequestError(`GitHub request failed for "${operationName}"`, undefined, lastError);
}

export async function executeGitHubGraphQL<T>({
  operationName,
  query,
  variables,
}: GraphQLRequestOptions): Promise<T> {
  const payload = await fetchWithRetry<T>({ operationName, query, variables });
  if (!payload.data) {
    throw new GitHubRequestError(`GitHub GraphQL query "${operationName}" returned no data`);
  }

  return payload.data;
}
