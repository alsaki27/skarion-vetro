type ErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export class DomainError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;

    switch (code) {
      case "NOT_FOUND":
        this.httpStatus = 404;
        break;
      case "FORBIDDEN":
        this.httpStatus = 403;
        break;
      case "CONFLICT":
        this.httpStatus = 409;
        break;
      case "VALIDATION_ERROR":
        this.httpStatus = 400;
        break;
      case "UNAUTHORIZED":
        this.httpStatus = 401;
        break;
      default:
        this.httpStatus = 500;
    }
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super("NOT_FOUND", id ? `${entity} not found: ${id}` : `${entity} not found`);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Access denied") {
    super("FORBIDDEN", message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super("CONFLICT", message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
  }
}
