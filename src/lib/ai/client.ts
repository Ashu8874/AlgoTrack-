import "server-only";

import { env } from "@/lib/env";
import { GroqAuthError, GroqRequestError, GroqResponseParseError } from "./errors";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 350;
const REQUEST_TIMEOUT_MS = 20_000;

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqChatCompletionRequest = {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object";
  };
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function extractJsonPayload(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new GroqResponseParseError("Groq returned an empty response body");
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new GroqResponseParseError("Groq response did not contain JSON");
  }

  return trimmed.slice(start, end + 1);
}

async function requestGroqCompletion(
  payload: GroqChatCompletionRequest,
): Promise<string> {
  if (!env.GROQ_API_KEY) {
    throw new GroqAuthError();
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.GROQ_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text().catch(() => "");
        if (isRetryableStatus(response.status) && attempt < DEFAULT_RETRY_ATTEMPTS) {
          await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
          continue;
        }

        throw new GroqRequestError(
          `Groq request failed with status ${response.status}`,
          response.status,
          responseText,
        );
      }

      const data = (await response.json()) as GroqChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new GroqResponseParseError("Groq response did not include message content", data);
      }

      return content;
    } catch (error) {
      lastError = error;
      const isAbortError = error instanceof DOMException && error.name === "AbortError";
      const statusCode = error instanceof GroqRequestError ? error.statusCode : undefined;

      if ((isAbortError || (statusCode !== undefined && isRetryableStatus(statusCode))) && attempt < DEFAULT_RETRY_ATTEMPTS) {
        await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
        continue;
      }

      if (error instanceof GroqAuthError || error instanceof GroqRequestError || error instanceof GroqResponseParseError) {
        throw error;
      }

      throw new GroqRequestError("Unexpected Groq request failure", undefined, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new GroqRequestError("Groq request failed after retries", undefined, lastError);
}

export async function generateGroqJson<T>({
  model,
  messages,
  schemaName,
  parse,
  temperature = 0.2,
  maxTokens = 800,
}: {
  model: string;
  messages: GroqMessage[];
  schemaName: string;
  parse: (value: unknown) => T;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const content = await requestGroqCompletion({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: {
      type: "json_object",
    },
  });

  const raw = extractJsonPayload(content);

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parse(parsed);
  } catch (error) {
    throw new GroqResponseParseError(`Failed to parse Groq JSON for ${schemaName}`, error);
  }
}

export type { GroqMessage };
