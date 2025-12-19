// =============================================================================
// Error Utilities
// =============================================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, true, details);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, { retryAfter });
    this.retryAfter = retryAfter;
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true, { service, ...details });
    this.service = service;
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, false, details);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FILE_UPLOAD_ERROR', 400, true, details);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', 402, true, details);
  }
}

// Error type guards
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

// Error formatting
export function formatError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
} {
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

// Error wrapping
export function wrapError(error: unknown, context: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return new AppError(`${context}: ${message}`, 'WRAPPED_ERROR', 500, false, {
    originalError: error instanceof Error ? error.name : typeof error,
  });
}

// Async error handling wrapper
export function catchAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      throw wrapError(error, fn.name || 'async function');
    }
  };
}

// Result type for explicit error handling
export type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
