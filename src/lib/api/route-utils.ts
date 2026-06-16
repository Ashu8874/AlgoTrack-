import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
  GitHubAuthError,
  GitHubError,
  GitHubRequestError,
  GitHubResponseParseError,
  GitHubNotFoundError,
} from "@/lib/github";
import {
  LeetCodeError,
  LeetCodeGraphQLError,
  LeetCodeNetworkError,
  LeetCodeNotFoundError,
} from "@/lib/leetcode";
import {
  TelegramAuthError,
  TelegramConfigError,
  TelegramError,
  TelegramRequestError,
  TelegramResponseParseError,
} from "@/lib/telegram";

export const usernameParamSchema = z.object({
  username: z.string().trim().min(1).max(64),
});

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status,
      headers: {
        "cache-control": "no-store, max-age=0, must-revalidate",
      },
    },
  );
}

export function jsonError(
  message: string,
  status = 500,
  details?: Record<string, unknown> | string[],
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details,
      },
    },
    {
      status,
      headers: {
        "cache-control": "no-store, max-age=0, must-revalidate",
      },
    },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 400, error.flatten());
  }

  if (error instanceof LeetCodeNotFoundError) {
    return jsonError(error.message, 404);
  }

  if (error instanceof LeetCodeGraphQLError) {
    return jsonError(error.message, 502, error.graphQLErrors);
  }

  if (error instanceof LeetCodeNetworkError) {
    return jsonError(error.message, error.statusCode ?? 502);
  }

  if (error instanceof LeetCodeError) {
    return jsonError(error.message, error.statusCode ?? 500);
  }

  if (error instanceof GitHubNotFoundError) {
    return jsonError(error.message, 404);
  }

  if (error instanceof GitHubResponseParseError) {
    return jsonError(error.message, 502);
  }

  if (error instanceof GitHubAuthError) {
    return jsonError(error.message, error.statusCode ?? 401);
  }

  if (error instanceof GitHubRequestError) {
    return jsonError(error.message, error.statusCode ?? 502);
  }

  if (error instanceof GitHubError) {
    return jsonError(error.message, error.statusCode ?? 500);
  }

  if (error instanceof TelegramConfigError) {
    return jsonError(error.message, error.statusCode ?? 400);
  }

  if (error instanceof TelegramAuthError) {
    return jsonError(error.message, error.statusCode ?? 401);
  }

  if (error instanceof TelegramResponseParseError) {
    return jsonError(error.message, 502);
  }

  if (error instanceof TelegramRequestError) {
    return jsonError(error.message, error.statusCode ?? 502);
  }

  if (error instanceof TelegramError) {
    return jsonError(error.message, error.statusCode ?? 500);
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return jsonError(message, 500);
}
