export class TelegramError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "TelegramError";
  }
}

export class TelegramConfigError extends TelegramError {
  constructor(message: string, cause?: unknown) {
    super(message, 400, cause);
    this.name = "TelegramConfigError";
  }
}

export class TelegramAuthError extends TelegramError {
  constructor(message = "Telegram bot token is missing or invalid", cause?: unknown) {
    super(message, 401, cause);
    this.name = "TelegramAuthError";
  }
}

export class TelegramRequestError extends TelegramError {
  constructor(message: string, statusCode?: number, cause?: unknown) {
    super(message, statusCode, cause);
    this.name = "TelegramRequestError";
  }
}

export class TelegramResponseParseError extends TelegramError {
  constructor(message: string, cause?: unknown) {
    super(message, 422, cause);
    this.name = "TelegramResponseParseError";
  }
}
