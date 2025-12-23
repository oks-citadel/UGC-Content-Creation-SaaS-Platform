// =============================================================================
// Error Response Formatter - Formats errors for API responses
// =============================================================================

import type {
  ApiErrorResponse,
  ErrorDetails,
  ErrorContext,
  CreateErrorResponseOptions,
  ErrorLike,
} from '@nexus/types';
import { HttpStatusCode, ServerErrorCode } from '@nexus/types';
import { BaseError } from './base-error';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default error messages for common HTTP status codes
 */
const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  [HttpStatusCode.BAD_REQUEST]: 'The request was invalid or malformed',
  [HttpStatusCode.UNAUTHORIZED]: 'Authentication is required to access this resource',
  [HttpStatusCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [HttpStatusCode.NOT_FOUND]: 'The requested resource was not found',
  [HttpStatusCode.CONFLICT]: 'The request conflicts with the current state of the resource',
  [HttpStatusCode.UNPROCESSABLE_ENTITY]: 'The request could not be processed due to validation errors',
  [HttpStatusCode.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later',
  [HttpStatusCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again later',
  [HttpStatusCode.BAD_GATEWAY]: 'An external service is currently unavailable',
  [HttpStatusCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable',
  [HttpStatusCode.GATEWAY_TIMEOUT]: 'The request timed out. Please try again',
};

/**
 * Default options for error response creation
 */
const DEFAULT_OPTIONS: CreateErrorResponseOptions = {
  includeStack: false,
  includeDetails: true,
  includeTimestamp: true,
  includePath: true,
};

/**
 * Format a BaseError into an API error response
 */
export function formatErrorResponse(
  error: BaseError,
  options: CreateErrorResponseOptions = {}
): ApiErrorResponse {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const correlationId = error.context?.requestId ?? generateCorrelationId();

  const response: ApiErrorResponse = {
    status: error.statusCode,
    errorCode: error.code,
    message: opts.customMessage ?? error.getUserMessage(),
    correlationId,
  };

  if (opts.includeDetails && error.metadata.exposeDetails && error.details) {
    response.details = sanitizeDetails(error.details);
  }

  if (opts.includeTimestamp) {
    response.timestamp = error.timestamp.toISOString();
  }

  if (opts.includePath && error.context?.path) {
    response.path = error.context.path;
  }

  if (opts.includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Format any error into an API error response
 */
export function formatAnyError(
  error: unknown,
  context?: Partial<ErrorContext>,
  options: CreateErrorResponseOptions = {}
): ApiErrorResponse {
  // If it's already a BaseError, use the specialized formatter
  if (error instanceof BaseError) {
    if (context) {
      return formatErrorResponse(error.withContext(context as ErrorContext), options);
    }
    return formatErrorResponse(error, options);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return formatStandardError(error, context, options);
  }

  // Handle error-like objects
  if (isErrorLike(error)) {
    return formatErrorLike(error, context, options);
  }

  // Handle unknown errors
  return formatUnknownError(error, context, options);
}

/**
 * Format a standard Error object
 */
function formatStandardError(
  error: Error,
  context?: Partial<ErrorContext>,
  options: CreateErrorResponseOptions = {}
): ApiErrorResponse {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const correlationId = context?.requestId ?? generateCorrelationId();

  const response: ApiErrorResponse = {
    status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    errorCode: ServerErrorCode.SERVER_INTERNAL_ERROR,
    message: opts.customMessage ?? getProductionSafeMessage(error.message),
    correlationId,
  };

  if (opts.includeTimestamp) {
    response.timestamp = new Date().toISOString();
  }

  if (opts.includePath && context?.path) {
    response.path = context.path;
  }

  if (opts.includeStack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Format an error-like object
 */
function formatErrorLike(
  error: ErrorLike,
  context?: Partial<ErrorContext>,
  options: CreateErrorResponseOptions = {}
): ApiErrorResponse {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const correlationId = context?.requestId ?? generateCorrelationId();

  const statusCode = error.statusCode ?? error.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR;
  const errorCode = String(error.code ?? ServerErrorCode.SERVER_INTERNAL_ERROR);

  const response: ApiErrorResponse = {
    status: statusCode,
    errorCode,
    message: opts.customMessage ?? getProductionSafeMessage(error.message),
    correlationId,
  };

  if (opts.includeTimestamp) {
    response.timestamp = new Date().toISOString();
  }

  if (opts.includePath && context?.path) {
    response.path = context.path;
  }

  if (opts.includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Format an unknown error
 */
function formatUnknownError(
  error: unknown,
  context?: Partial<ErrorContext>,
  options: CreateErrorResponseOptions = {}
): ApiErrorResponse {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const correlationId = context?.requestId ?? generateCorrelationId();

  const response: ApiErrorResponse = {
    status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    errorCode: ServerErrorCode.SERVER_INTERNAL_ERROR,
    message: opts.customMessage ?? DEFAULT_ERROR_MESSAGES[HttpStatusCode.INTERNAL_SERVER_ERROR],
    correlationId,
  };

  if (opts.includeTimestamp) {
    response.timestamp = new Date().toISOString();
  }

  if (opts.includePath && context?.path) {
    response.path = context.path;
  }

  if (opts.includeDetails) {
    response.details = {
      metadata: {
        errorType: typeof error,
        errorValue: String(error),
      },
    };
  }

  return response;
}

/**
 * Type guard for error-like objects
 */
export function isErrorLike(value: unknown): value is ErrorLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as ErrorLike).message === 'string'
  );
}

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Get a production-safe error message
 * Hides internal details from potentially sensitive error messages
 */
function getProductionSafeMessage(message: string): string {
  // Check if message contains potentially sensitive information
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /credential/i,
    /auth/i,
    /database.*error/i,
    /sql.*error/i,
    /connection.*refused/i,
    /econnrefused/i,
    /etimedout/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return DEFAULT_ERROR_MESSAGES[HttpStatusCode.INTERNAL_SERVER_ERROR];
    }
  }

  return message;
}

/**
 * Sanitize error details to remove sensitive information
 */
function sanitizeDetails(details: ErrorDetails): ErrorDetails {
  const sanitized = { ...details };

  // Remove potentially sensitive metadata
  if (sanitized.metadata) {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential', 'authorization'];
    sanitized.metadata = Object.fromEntries(
      Object.entries(sanitized.metadata).filter(
        ([key]) => !sensitiveKeys.some((s) => key.toLowerCase().includes(s))
      )
    );
  }

  return sanitized;
}

/**
 * Create a minimal error response (useful for very sensitive endpoints)
 */
export function formatMinimalError(
  statusCode: HttpStatusCode,
  correlationId?: string
): ApiErrorResponse {
  return {
    status: statusCode,
    errorCode: getDefaultErrorCode(statusCode),
    message: DEFAULT_ERROR_MESSAGES[statusCode] ?? 'An error occurred',
    correlationId: correlationId ?? generateCorrelationId(),
  };
}

/**
 * Get default error code for a status code
 */
function getDefaultErrorCode(statusCode: HttpStatusCode): string {
  switch (statusCode) {
    case HttpStatusCode.BAD_REQUEST:
      return 'VALIDATION_FAILED';
    case HttpStatusCode.UNAUTHORIZED:
      return 'AUTH_TOKEN_INVALID';
    case HttpStatusCode.FORBIDDEN:
      return 'AUTHZ_FORBIDDEN';
    case HttpStatusCode.NOT_FOUND:
      return 'RESOURCE_NOT_FOUND';
    case HttpStatusCode.CONFLICT:
      return 'RESOURCE_CONFLICT';
    case HttpStatusCode.UNPROCESSABLE_ENTITY:
      return 'VALIDATION_FAILED';
    case HttpStatusCode.TOO_MANY_REQUESTS:
      return 'RATE_LIMIT_EXCEEDED';
    case HttpStatusCode.INTERNAL_SERVER_ERROR:
      return 'SERVER_INTERNAL_ERROR';
    case HttpStatusCode.BAD_GATEWAY:
      return 'EXTERNAL_SERVICE_ERROR';
    case HttpStatusCode.SERVICE_UNAVAILABLE:
      return 'EXTERNAL_SERVICE_UNAVAILABLE';
    case HttpStatusCode.GATEWAY_TIMEOUT:
      return 'EXTERNAL_SERVICE_TIMEOUT';
    default:
      return 'SERVER_INTERNAL_ERROR';
  }
}
