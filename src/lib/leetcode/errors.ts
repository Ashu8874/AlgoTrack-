export class LeetCodeError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LeetCodeError";
  }
}

export class LeetCodeNetworkError extends LeetCodeError {
  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
    this.name = "LeetCodeNetworkError";
  }
}

export class LeetCodeGraphQLError extends LeetCodeError {
  constructor(message: string, public readonly graphQLErrors: string[], statusCode?: number) {
    super(message, statusCode);
    this.name = "LeetCodeGraphQLError";
  }
}

export class LeetCodeNotFoundError extends LeetCodeError {
  constructor(username: string) {
    super(`LeetCode user "${username}" was not found`, 404);
    this.name = "LeetCodeNotFoundError";
  }
}
