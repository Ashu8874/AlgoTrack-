export class GroqAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GroqAIError";
  }
}

export class GroqAuthError extends GroqAIError {
  constructor(message = "Groq API key is missing or invalid", cause?: unknown) {
    super(message, 401, cause);
    this.name = "GroqAuthError";
  }
}

export class GroqResponseParseError extends GroqAIError {
  constructor(message: string, cause?: unknown) {
    super(message, 422, cause);
    this.name = "GroqResponseParseError";
  }
}

export class GroqRequestError extends GroqAIError {
  constructor(message: string, statusCode?: number, cause?: unknown) {
    super(message, statusCode, cause);
    this.name = "GroqRequestError";
  }
}
