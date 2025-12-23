// =============================================================================
// Error Type Guards - Type-safe error checking utilities
// =============================================================================

import type { ApiErrorResponse, ErrorCode } from '@nexus/types';
import {
  AuthErrorCode,
  AuthorizationErrorCode,
  ValidationErrorCode,
  ResourceErrorCode,
  BusinessErrorCode,
  ExternalServiceErrorCode,
  RateLimitErrorCode,
  ServerErrorCode,
  MediaErrorCode,
} from '@nexus/types';
import { BaseError } from './base-error';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceConflictError,
  BusinessError,
  ExternalServiceError,
  RateLimitError,
  InternalServerError,
  MediaError,
} from './error-classes';

// =============================================================================
// Base Error Guards
// =============================================================================

/**
 * Check if a value is a BaseError
 */
export function isBaseError(value: unknown): value is BaseError {
  return value instanceof BaseError;
}

/**
 * Check if a value is any Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Check if an error is operational (expected) vs a programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.isOperational();
  }
  return false;
}

// =============================================================================
// Specific Error Type Guards
// =============================================================================

/**
 * Check if an error is an AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Check if an error is an AuthorizationError
 */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if an error is a ResourceNotFoundError
 */
export function isResourceNotFoundError(error: unknown): error is ResourceNotFoundError {
  return error instanceof ResourceNotFoundError;
}

/**
 * Check if an error is a ResourceAlreadyExistsError
 */
export function isResourceAlreadyExistsError(error: unknown): error is ResourceAlreadyExistsError {
  return error instanceof ResourceAlreadyExistsError;
}

/**
 * Check if an error is a ResourceConflictError
 */
export function isResourceConflictError(error: unknown): error is ResourceConflictError {
  return error instanceof ResourceConflictError;
}

/**
 * Check if an error is a BusinessError
 */
export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError;
}

/**
 * Check if an error is an ExternalServiceError
 */
export function isExternalServiceError(error: unknown): error is ExternalServiceError {
  return error instanceof ExternalServiceError;
}

/**
 * Check if an error is a RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Check if an error is an InternalServerError
 */
export function isInternalServerError(error: unknown): error is InternalServerError {
  return error instanceof InternalServerError;
}

/**
 * Check if an error is a MediaError
 */
export function isMediaError(error: unknown): error is MediaError {
  return error instanceof MediaError;
}

// =============================================================================
// Error Code Category Guards
// =============================================================================

/**
 * Check if an error has an auth error code
 */
export function hasAuthErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(AuthErrorCode).includes(error.code as AuthErrorCode);
  }
  return false;
}

/**
 * Check if an error has an authorization error code
 */
export function hasAuthorizationErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(AuthorizationErrorCode).includes(error.code as AuthorizationErrorCode);
  }
  return false;
}

/**
 * Check if an error has a validation error code
 */
export function hasValidationErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(ValidationErrorCode).includes(error.code as ValidationErrorCode);
  }
  return false;
}

/**
 * Check if an error has a resource error code
 */
export function hasResourceErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(ResourceErrorCode).includes(error.code as ResourceErrorCode);
  }
  return false;
}

/**
 * Check if an error has a business error code
 */
export function hasBusinessErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(BusinessErrorCode).includes(error.code as BusinessErrorCode);
  }
  return false;
}

/**
 * Check if an error has an external service error code
 */
export function hasExternalServiceErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(ExternalServiceErrorCode).includes(error.code as ExternalServiceErrorCode);
  }
  return false;
}

/**
 * Check if an error has a rate limit error code
 */
export function hasRateLimitErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(RateLimitErrorCode).includes(error.code as RateLimitErrorCode);
  }
  return false;
}

/**
 * Check if an error has a server error code
 */
export function hasServerErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(ServerErrorCode).includes(error.code as ServerErrorCode);
  }
  return false;
}

/**
 * Check if an error has a media error code
 */
export function hasMediaErrorCode(error: unknown): boolean {
  if (error instanceof BaseError) {
    return Object.values(MediaErrorCode).includes(error.code as MediaErrorCode);
  }
  return false;
}

// =============================================================================
// Specific Error Code Guards
// =============================================================================

/**
 * Check if an error has a specific error code
 */
export function hasErrorCode(error: unknown, code: ErrorCode | string): boolean {
  if (error instanceof BaseError) {
    return error.code === code;
  }
  return false;
}

/**
 * Check if an error has any of the specified error codes
 */
export function hasAnyErrorCode(error: unknown, codes: (ErrorCode | string)[]): boolean {
  if (error instanceof BaseError) {
    return codes.includes(error.code as ErrorCode);
  }
  return false;
}

// =============================================================================
// HTTP Status Guards
// =============================================================================

/**
 * Check if an error has a specific HTTP status code
 */
export function hasStatusCode(error: unknown, statusCode: number): boolean {
  if (error instanceof BaseError) {
    return error.statusCode === statusCode;
  }
  return false;
}

/**
 * Check if an error is a 4xx client error
 */
export function isClientError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.statusCode >= 400 && error.statusCode < 500;
  }
  return false;
}

/**
 * Check if an error is a 5xx server error
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.statusCode >= 500;
  }
  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.isRetryable();
  }
  return false;
}

// =============================================================================
// API Error Response Guards
// =============================================================================

/**
 * Check if a value is an API error response
 */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Partial<ApiErrorResponse>;
  return (
    typeof response.status === 'number' &&
    typeof response.errorCode === 'string' &&
    typeof response.message === 'string' &&
    typeof response.correlationId === 'string'
  );
}

/**
 * Check if an API response indicates an error
 */
export function isErrorResponse(response: { status?: number; success?: boolean }): boolean {
  if (typeof response.status === 'number') {
    return response.status >= 400;
  }
  if (typeof response.success === 'boolean') {
    return !response.success;
  }
  return false;
}

// =============================================================================
// Aggregate Guards
// =============================================================================

/**
 * Check if an error requires user authentication
 */
export function requiresAuthentication(error: unknown): boolean {
  return isAuthenticationError(error) || hasStatusCode(error, 401);
}

/**
 * Check if an error indicates insufficient permissions
 */
export function insufficientPermissions(error: unknown): boolean {
  return isAuthorizationError(error) || hasStatusCode(error, 403);
}

/**
 * Check if an error indicates the resource was not found
 */
export function resourceNotFound(error: unknown): boolean {
  return isResourceNotFoundError(error) || hasStatusCode(error, 404);
}

/**
 * Check if an error is due to rate limiting
 */
export function isRateLimited(error: unknown): boolean {
  return isRateLimitError(error) || hasStatusCode(error, 429);
}

/**
 * Check if an error is due to an external service failure
 */
export function isExternalFailure(error: unknown): boolean {
  return (
    isExternalServiceError(error) ||
    hasStatusCode(error, 502) ||
    hasStatusCode(error, 503) ||
    hasStatusCode(error, 504)
  );
}
