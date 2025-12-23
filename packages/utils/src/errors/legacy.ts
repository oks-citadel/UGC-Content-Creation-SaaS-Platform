// =============================================================================
// Legacy Error Utilities - Backward compatibility exports
// =============================================================================
// These are re-exported from the original errors.ts for backward compatibility

/**
 * @deprecated Use BaseError from './base-error' instead
 */
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

// Error type guards (legacy versions)
/**
 * @deprecated Use isBaseError from './guards' instead
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * @deprecated Use isOperationalError from './guards' instead
 */
export function isOperationalErrorLegacy(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

// Legacy error formatting
/**
 * @deprecated Use formatErrorResponse from './formatter' instead
 */
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

// Error wrapping (legacy)
/**
 * @deprecated Use BaseError.withContext() instead
 */
export function wrapError(error: unknown, context: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return new AppError(`${context}: ${message}`, 'WRAPPED_ERROR', 500, false, {
    originalError: error instanceof Error ? error.name : typeof error,
  });
}

// Async error handling wrapper (legacy)
/**
 * @deprecated Consider using try-catch with BaseError instead
 */
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
