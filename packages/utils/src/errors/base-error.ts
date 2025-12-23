// =============================================================================
// Base Error Class - Foundation for all application errors
// =============================================================================

import type {
  ErrorCode,
  ErrorDetails,
  ErrorMetadata,
  ErrorContext,
  SerializedError,
} from '@nexus/types';
import { HttpStatusCode, getHttpStatusForErrorCode } from '@nexus/types';

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class BaseError extends Error {
  /** Application-specific error code */
  public readonly code: ErrorCode | string;

  /** HTTP status code for API responses */
  public readonly statusCode: HttpStatusCode;

  /** Error details (validation errors, additional context) */
  public readonly details?: ErrorDetails;

  /** Error metadata for handling behavior */
  public readonly metadata: ErrorMetadata;

  /** Error context for logging */
  public readonly context?: ErrorContext;

  /** Original error that caused this error */
  public readonly cause?: Error;

  /** Timestamp when the error was created */
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode | string,
    options?: {
      statusCode?: HttpStatusCode;
      details?: ErrorDetails;
      metadata?: Partial<ErrorMetadata>;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message);

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();

    // Determine HTTP status code
    this.statusCode =
      options?.statusCode ??
      (this.isErrorCode(code) ? getHttpStatusForErrorCode(code as ErrorCode) : HttpStatusCode.INTERNAL_SERVER_ERROR);

    this.details = options?.details;
    this.cause = options?.cause;
    this.context = options?.context;

    // Set default metadata
    this.metadata = {
      isOperational: true,
      shouldLog: true,
      logLevel: this.statusCode >= 500 ? 'error' : 'warn',
      shouldReport: this.statusCode >= 500,
      exposeDetails: this.statusCode < 500,
      retryable: false,
      ...options?.metadata,
    };

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Check if a code is a valid ErrorCode
   */
  private isErrorCode(code: string): boolean {
    // Check if the code matches the pattern of our error codes
    return /^(AUTH|AUTHZ|VALIDATION|RESOURCE|BUSINESS|EXTERNAL|RATE_LIMIT|SERVER|MEDIA)_/.test(code);
  }

  /**
   * Serialize error for logging or transmission
   */
  public serialize(includeStack = false): SerializedError {
    const serialized: SerializedError = {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };

    if (includeStack && this.stack) {
      serialized.stack = this.stack;
    }

    if (this.cause instanceof BaseError) {
      serialized.cause = this.cause.serialize(includeStack);
    } else if (this.cause) {
      serialized.cause = {
        name: this.cause.name,
        message: this.cause.message,
        code: 'UNKNOWN',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        timestamp: this.timestamp.toISOString(),
        stack: includeStack ? this.cause.stack : undefined,
      };
    }

    return serialized;
  }

  /**
   * Convert to JSON for API responses
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.metadata.exposeDetails ? this.details : undefined,
    };
  }

  /**
   * Get a user-friendly error message
   */
  public getUserMessage(): string {
    return this.message;
  }

  /**
   * Check if this error is operational (expected) vs programming error
   */
  public isOperational(): boolean {
    return this.metadata.isOperational;
  }

  /**
   * Check if this error should be retried
   */
  public isRetryable(): boolean {
    return this.metadata.retryable;
  }

  /**
   * Create a new error with additional context
   */
  public withContext(context: ErrorContext): BaseError {
    return new BaseError(this.message, this.code, {
      statusCode: this.statusCode,
      details: this.details,
      metadata: this.metadata,
      context: { ...this.context, ...context },
      cause: this.cause,
    });
  }

  /**
   * Create a new error with additional details
   */
  public withDetails(details: Partial<ErrorDetails>): BaseError {
    return new BaseError(this.message, this.code, {
      statusCode: this.statusCode,
      details: { ...this.details, ...details },
      metadata: this.metadata,
      context: this.context,
      cause: this.cause,
    });
  }
}
