// =============================================================================
// Error Response Types - TypeScript Types for API Error Responses
// =============================================================================

import type { ErrorCode } from './codes';

/**
 * Standard API error response structure
 * All API errors should conform to this interface
 */
export interface ApiErrorResponse {
  /** HTTP status code */
  status: number;

  /** Application-specific error code from ErrorCode enum */
  errorCode: string;

  /** Human-readable error message */
  message: string;

  /** Unique identifier for tracing this error across services */
  correlationId: string;

  /** Additional details about the error (validation errors, field-specific info, etc.) */
  details?: ErrorDetails;

  /** ISO 8601 timestamp when the error occurred */
  timestamp?: string;

  /** Request path that caused the error */
  path?: string;

  /** Stack trace (only in development mode) */
  stack?: string;
}

/**
 * Error details for additional context
 */
export interface ErrorDetails {
  /** Field-level validation errors */
  fieldErrors?: FieldError[];

  /** General validation errors not tied to a specific field */
  generalErrors?: string[];

  /** The resource type that was involved in the error */
  resourceType?: string;

  /** The resource ID that was involved in the error */
  resourceId?: string;

  /** Suggested actions to resolve the error */
  suggestions?: string[];

  /** Link to documentation about this error */
  documentationUrl?: string;

  /** Rate limit information for rate limit errors */
  rateLimit?: RateLimitInfo;

  /** Retry information for retryable errors */
  retry?: RetryInfo;

  /** Any additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Field-level validation error
 */
export interface FieldError {
  /** The field name or path (e.g., "email" or "address.city") */
  field: string;

  /** Error message for this field */
  message: string;

  /** The invalid value (may be omitted for security) */
  value?: unknown;

  /** Specific validation rule that failed */
  rule?: string;

  /** Error code specific to this field error */
  code?: string;
}

/**
 * Rate limit information included in rate limit errors
 */
export interface RateLimitInfo {
  /** Maximum number of requests allowed */
  limit: number;

  /** Number of remaining requests */
  remaining: number;

  /** Unix timestamp when the rate limit resets */
  resetAt: number;

  /** Seconds until the rate limit resets */
  retryAfter: number;

  /** Type of rate limit (ip, user, api_key, endpoint) */
  limitType?: 'ip' | 'user' | 'api_key' | 'endpoint';
}

/**
 * Retry information for retryable errors
 */
export interface RetryInfo {
  /** Whether this error is retryable */
  retryable: boolean;

  /** Suggested number of seconds to wait before retrying */
  retryAfter?: number;

  /** Maximum number of retry attempts recommended */
  maxRetries?: number;

  /** Exponential backoff base (if applicable) */
  backoffBase?: number;
}

/**
 * Error context for logging and debugging
 */
export interface ErrorContext {
  /** User ID if authenticated */
  userId?: string;

  /** Organization ID if applicable */
  organizationId?: string;

  /** Request ID from the incoming request */
  requestId?: string;

  /** Trace ID for distributed tracing */
  traceId?: string;

  /** Span ID for distributed tracing */
  spanId?: string;

  /** Service name that generated the error */
  service?: string;

  /** HTTP method of the request */
  method?: string;

  /** Request path */
  path?: string;

  /** User agent string */
  userAgent?: string;

  /** Client IP address */
  clientIp?: string;

  /** Additional context data */
  extra?: Record<string, unknown>;
}

/**
 * Serialized error for logging
 */
export interface SerializedError {
  name: string;
  message: string;
  code: string;
  statusCode: number;
  stack?: string;
  details?: ErrorDetails;
  context?: ErrorContext;
  cause?: SerializedError;
  timestamp: string;
}

/**
 * Error metadata for error classes
 */
export interface ErrorMetadata {
  /** Whether this error is operational (expected) vs programming error */
  isOperational: boolean;

  /** Whether this error should be logged */
  shouldLog: boolean;

  /** Log level for this error */
  logLevel: 'error' | 'warn' | 'info' | 'debug';

  /** Whether this error should be reported to error tracking service */
  shouldReport: boolean;

  /** Whether the response should include error details */
  exposeDetails: boolean;

  /** Whether this error is retryable */
  retryable: boolean;
}

/**
 * Type for error code to message mapping
 */
export type ErrorMessageMap = Partial<Record<ErrorCode, string>>;

/**
 * Type guard input for error checking
 */
export interface ErrorLike {
  message: string;
  name?: string;
  stack?: string;
  code?: string | number;
  statusCode?: number;
  status?: number;
}

/**
 * Options for creating an error response
 */
export interface CreateErrorResponseOptions {
  /** Whether to include stack trace */
  includeStack?: boolean;

  /** Whether to include error details */
  includeDetails?: boolean;

  /** Whether to include timestamp */
  includeTimestamp?: boolean;

  /** Whether to include request path */
  includePath?: boolean;

  /** Custom message to override the error message */
  customMessage?: string;
}

/**
 * Result type for operations that can fail
 */
export type ErrorResult<T, E = ApiErrorResponse> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

/**
 * Async result type
 */
export type AsyncErrorResult<T, E = ApiErrorResponse> = Promise<ErrorResult<T, E>>;
