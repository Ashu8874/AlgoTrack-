export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class GitHubAuthError extends GitHubError {
  constructor(message = "GitHub token is missing or invalid", cause?: unknown) {
    super(message, 401, cause);
    this.name = "GitHubAuthError";
  }
}

export class GitHubRequestError extends GitHubError {
  constructor(message: string, statusCode?: number, cause?: unknown) {
    super(message, statusCode, cause);
    this.name = "GitHubRequestError";
  }
}

export class GitHubResponseParseError extends GitHubError {
  constructor(message: string, cause?: unknown) {
    super(message, 422, cause);
    this.name = "GitHubResponseParseError";
  }
}

export class GitHubNotFoundError extends GitHubError {
  constructor(username: string) {
    super(`GitHub user "${username}" was not found`, 404);
    this.name = "GitHubNotFoundError";
  }
}
