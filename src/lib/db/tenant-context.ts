// Tenant-scoped request context — every route must resolve this before accessing DB.
// Repositories take TenantContext at compile time, so no query can accidentally
// omit org scoping.

export interface TenantContext {
  orgId: string;
  userId: string;
  role: "student" | "instructor" | "admin";
  isPlatformStaff?: boolean;
  requestId: string;
}

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number = 400,
  ) {
    super(message);
    this.name = "DomainError";
  }

  toJSON() {
    return { error: this.message, error_code: this.code };
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string) {
    super(`${entity} not found`, "NOT_FOUND", 404);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Insufficient permissions") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID().slice(0, 8);
  return `req_${ts}_${rand}`;
}
