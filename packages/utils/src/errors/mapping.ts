// =============================================================================
// Error Mapping Utilities - Convert errors between different formats
// =============================================================================

import type {
  ErrorCode,
  ErrorContext,
  ErrorDetails,
  FieldError,
  ErrorMessageMap,
} from '@nexus/types';
import {
  AuthErrorCode,
  ValidationErrorCode,
  ResourceErrorCode,
  ServerErrorCode,
  HttpStatusCode,
} from '@nexus/types';
import { BaseError } from './base-error';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ResourceNotFoundError,
  BusinessError,
  ExternalServiceError,
  RateLimitError,
  InternalServerError,
  TokenExpiredError,
  InvalidCredentialsError,
} from './error-classes';

/**
 * Default error messages for error codes
 */
export const defaultErrorMessages: ErrorMessageMap = {
  // Auth errors
  [AuthErrorCode.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [AuthErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token.',
  [AuthErrorCode.AUTH_TOKEN_MISSING]: 'Authentication token is required.',
  [AuthErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  [AuthErrorCode.AUTH_ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support.',
  [AuthErrorCode.AUTH_ACCOUNT_DISABLED]: 'Your account has been disabled.',
  [AuthErrorCode.AUTH_MFA_REQUIRED]: 'Multi-factor authentication is required.',

  // Validation errors
  [ValidationErrorCode.VALIDATION_FAILED]: 'The provided data is invalid.',
  [ValidationErrorCode.VALIDATION_REQUIRED_FIELD]: 'A required field is missing.',
  [ValidationErrorCode.VALIDATION_INVALID_EMAIL]: 'Please provide a valid email address.',

  // Resource errors
  [ResourceErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
  [ResourceErrorCode.RESOURCE_ALREADY_EXISTS]: 'A resource with this identifier already exists.',
  [ResourceErrorCode.RESOURCE_CONFLICT]: 'The operation conflicts with the current state.',

  // Server errors
  [ServerErrorCode.SERVER_INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
  [ServerErrorCode.SERVER_MAINTENANCE_MODE]: 'The service is temporarily unavailable for maintenance.',
};

/**
 * Get error message for an error code
 */
export function getErrorMessage(code: ErrorCode, customMessages?: ErrorMessageMap): string {
  const messages = { ...defaultErrorMessages, ...customMessages };
  return messages[code] ?? 'An error occurred';
}

/**
 * Map HTTP error response to BaseError
 */
export function mapHttpErrorToBaseError(
  statusCode: number,
  body?: {
    code?: string;
    message?: string;
    details?: ErrorDetails;
  },
  context?: ErrorContext
): BaseError {
  const errorCode = body?.code ?? getErrorCodeFromStatus(statusCode);
  const message = body?.message ?? getDefaultMessageFromStatus(statusCode);

  switch (statusCode) {
    case HttpStatusCode.UNAUTHORIZED:
      if (body?.code === AuthErrorCode.AUTH_TOKEN_EXPIRED) {
        return new TokenExpiredError(message, context);
      }
      if (body?.code === AuthErrorCode.AUTH_INVALID_CREDENTIALS) {
        return new InvalidCredentialsError(message, context);
      }
      return new AuthenticationError(message, errorCode as AuthErrorCode, {
        details: body?.details,
        context,
      });

    case HttpStatusCode.FORBIDDEN:
      return new AuthorizationError(message, undefined, {
        details: body?.details,
        context,
      });

    case HttpStatusCode.BAD_REQUEST:
    case HttpStatusCode.UNPROCESSABLE_ENTITY:
      return new ValidationError(message, body?.details?.fieldErrors ?? [], {
        context,
      });

    case HttpStatusCode.NOT_FOUND:
      return new ResourceNotFoundError(
        body?.details?.resourceType ?? 'Resource',
        body?.details?.resourceId,
        { context }
      );

    case HttpStatusCode.CONFLICT:
      return new BaseError(message, ResourceErrorCode.RESOURCE_CONFLICT, {
        statusCode: HttpStatusCode.CONFLICT,
        details: body?.details,
        context,
      });

    case HttpStatusCode.TOO_MANY_REQUESTS:
      return new RateLimitError(message, {
        retryAfter: body?.details?.rateLimit?.retryAfter ?? 60,
        limit: body?.details?.rateLimit?.limit ?? 0,
        remaining: body?.details?.rateLimit?.remaining ?? 0,
        context,
      });

    case HttpStatusCode.BAD_GATEWAY:
    case HttpStatusCode.SERVICE_UNAVAILABLE:
    case HttpStatusCode.GATEWAY_TIMEOUT:
      return new ExternalServiceError('External Service', message, undefined, {
        details: body?.details,
        context,
        retryable: true,
      });

    default:
      if (statusCode >= 500) {
        return new InternalServerError(message, {
          details: body?.details,
          context,
        });
      }
      return new BaseError(message, errorCode, {
        statusCode: statusCode as HttpStatusCode,
        details: body?.details,
        context,
      });
  }
}

/**
 * Map a standard Error to BaseError
 */
export function mapStandardErrorToBaseError(
  error: Error,
  context?: ErrorContext
): BaseError {
  // Check for common Node.js error codes
  const nodeError = error as Error & { code?: string };

  switch (nodeError.code) {
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'EHOSTUNREACH':
      return new ExternalServiceError(
        'Network',
        `Connection failed: ${error.message}`,
        undefined,
        { cause: error, context, retryable: true }
      );

    case 'ETIMEDOUT':
    case 'ESOCKETTIMEDOUT':
      return new ExternalServiceError(
        'Network',
        `Request timed out: ${error.message}`,
        undefined,
        { cause: error, context, retryable: true }
      );

    case 'ENOENT':
      return new ResourceNotFoundError('File', undefined, { cause: error, context });

    case 'EACCES':
    case 'EPERM':
      return new AuthorizationError('Access denied to resource', undefined, {
        cause: error,
        context,
      });

    default:
      return new InternalServerError(error.message, {
        cause: error,
        context,
      });
  }
}

/**
 * Map database/ORM errors to BaseError
 */
export function mapDatabaseErrorToBaseError(
  error: Error & {
    code?: string;
    constraint?: string;
    table?: string;
    column?: string;
  },
  context?: ErrorContext
): BaseError {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // unique_violation
      return new BaseError(
        `Duplicate value violates unique constraint${error.constraint ? `: ${error.constraint}` : ''}`,
        ResourceErrorCode.RESOURCE_ALREADY_EXISTS,
        {
          statusCode: HttpStatusCode.CONFLICT,
          details: {
            metadata: {
              constraint: error.constraint,
              table: error.table,
            },
          },
          cause: error,
          context,
        }
      );

    case '23503': // foreign_key_violation
      return new BaseError(
        'Referenced record does not exist',
        ResourceErrorCode.RESOURCE_DEPENDENCY_ERROR,
        {
          statusCode: HttpStatusCode.BAD_REQUEST,
          details: {
            metadata: {
              constraint: error.constraint,
              table: error.table,
            },
          },
          cause: error,
          context,
        }
      );

    case '23502': // not_null_violation
      return new ValidationError(`Required field '${error.column}' is missing`, [
        {
          field: error.column ?? 'unknown',
          message: 'This field is required',
          rule: 'not_null',
        },
      ], { cause: error, context });

    case '22P02': // invalid_text_representation
      return new ValidationError('Invalid data format', [], {
        cause: error,
        context,
      });

    case '42P01': // undefined_table
    case '42703': // undefined_column
      return new InternalServerError('Database schema error', {
        cause: error,
        context,
      });

    default:
      return new InternalServerError(
        'A database error occurred',
        { cause: error, context }
      );
  }
}

/**
 * Map validation library errors (e.g., Zod, Joi) to ValidationError
 */
export function mapValidationErrorToBaseError(
  errors: Array<{
    path?: (string | number)[];
    message: string;
    code?: string;
  }>,
  context?: ErrorContext
): ValidationError {
  const fieldErrors: FieldError[] = errors.map((error) => ({
    field: error.path?.join('.') ?? 'unknown',
    message: error.message,
    code: error.code,
  }));

  return new ValidationError(
    `Validation failed: ${fieldErrors.length} error(s)`,
    fieldErrors,
    { context }
  );
}

/**
 * Get error code from HTTP status
 */
function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return ValidationErrorCode.VALIDATION_FAILED;
    case 401:
      return AuthErrorCode.AUTH_TOKEN_INVALID;
    case 403:
      return 'AUTHZ_FORBIDDEN';
    case 404:
      return ResourceErrorCode.RESOURCE_NOT_FOUND;
    case 409:
      return ResourceErrorCode.RESOURCE_CONFLICT;
    case 422:
      return ValidationErrorCode.VALIDATION_FAILED;
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return ServerErrorCode.SERVER_INTERNAL_ERROR;
    case 502:
      return 'EXTERNAL_SERVICE_ERROR';
    case 503:
      return 'EXTERNAL_SERVICE_UNAVAILABLE';
    case 504:
      return 'EXTERNAL_SERVICE_TIMEOUT';
    default:
      return ServerErrorCode.SERVER_INTERNAL_ERROR;
  }
}

/**
 * Get default message from HTTP status
 */
function getDefaultMessageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The request was invalid';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Resource conflict';
    case 422:
      return 'Validation failed';
    case 429:
      return 'Too many requests';
    case 500:
      return 'Internal server error';
    case 502:
      return 'External service error';
    case 503:
      return 'Service unavailable';
    case 504:
      return 'Request timeout';
    default:
      return 'An error occurred';
  }
}

/**
 * Check if an error is retryable based on its type
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.isRetryable();
  }

  // Check for common retryable error types
  if (error instanceof Error) {
    const nodeError = error as Error & { code?: string };
    const retryableCodes = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ESOCKETTIMEDOUT',
      'ECONNRESET',
      'EPIPE',
    ];
    return nodeError.code ? retryableCodes.includes(nodeError.code) : false;
  }

  return false;
}

/**
 * Check if an error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.statusCode >= 400 && error.statusCode < 500;
  }
  return false;
}

/**
 * Check if an error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.statusCode >= 500;
  }
  return false;
}
