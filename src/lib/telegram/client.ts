import "server-only";

import { env } from "@/lib/env";
import {
  TelegramAuthError,
  TelegramRequestError,
  TelegramResponseParseError,
} from "./errors";
import type { TelegramApiResponse, TelegramMessageInput, TelegramSendMessageResult } from "./types";

const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 15000;

type TelegramSendRequest = TelegramMessageInput & {
  chatId: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status?: number) {
  return !status || status === 429 || status >= 500;
}

function assertConfigured(chatId: string) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new TelegramAuthError();
  }

  if (!chatId) {
    throw new TelegramRequestError(
      "Telegram chat id is missing. Provide chatId or set TELEGRAM_CHAT_ID.",
      400,
    );
  }
}

async function postWithRetry({
  chatId,
  text,
  disableWebPagePreview = true,
}: TelegramSendRequest): Promise<TelegramSendMessageResult> {
  assertConfigured(chatId);

  let lastError: unknown;
  const endpoint = `${env.TELEGRAM_API_BASE_URL.replace(/\/$/, "")}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: disableWebPagePreview,
        }),
        signal: controller.signal,
      });

      const rawBody = await response.text().catch(() => "");

      if (!response.ok) {
        if (shouldRetry(response.status) && attempt < DEFAULT_RETRY_ATTEMPTS) {
          await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
          continue;
        }

        if (response.status === 401 || response.status === 403) {
          throw new TelegramAuthError(
            `Telegram request failed with status ${response.status}`,
            rawBody,
          );
        }

        throw new TelegramRequestError(
          `Telegram request failed with status ${response.status}`,
          response.status,
          rawBody,
        );
      }

      let payload: TelegramApiResponse;
      try {
        payload = JSON.parse(rawBody) as TelegramApiResponse;
      } catch (error) {
        throw new TelegramResponseParseError("Telegram returned invalid JSON", error);
      }

      if (!payload.ok || !payload.result) {
        throw new TelegramRequestError(
          payload.description ?? "Telegram API returned an unsuccessful response",
          response.status,
          payload,
        );
      }

      return payload.result;
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      const status = error instanceof TelegramRequestError ? error.statusCode : undefined;

      if ((isAbort || shouldRetry(status)) && attempt < DEFAULT_RETRY_ATTEMPTS) {
        await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
        continue;
      }

      if (
        error instanceof TelegramAuthError ||
        error instanceof TelegramRequestError ||
        error instanceof TelegramResponseParseError
      ) {
        throw error;
      }

      throw new TelegramRequestError("Telegram request failed", undefined, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new TelegramRequestError("Telegram request failed", undefined, lastError);
}

export async function sendTelegramMessage(input: TelegramMessageInput): Promise<TelegramSendMessageResult> {
  return postWithRetry({
    chatId: input.chatId ?? env.TELEGRAM_CHAT_ID,
    text: input.text,
    disableWebPagePreview: input.disableWebPagePreview,
  });
}
