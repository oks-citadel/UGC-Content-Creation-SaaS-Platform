// =============================================================================
// Specialized Error Classes - Domain-specific errors
// =============================================================================

import type { ErrorDetails, ErrorContext, FieldError } from '@nexus/types';
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
  HttpStatusCode,
} from '@nexus/types';
import { BaseError } from './base-error';

// =============================================================================
// Authentication Errors
// =============================================================================

export class AuthenticationError extends BaseError {
  constructor(
    message = 'Authentication required',
    code: AuthErrorCode = AuthErrorCode.AUTH_TOKEN_INVALID,
    options?: {
      details?: ErrorDetails;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'warn',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Token has expired', context?: ErrorContext) {
    super(message, AuthErrorCode.AUTH_TOKEN_EXPIRED, { context });
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message = 'Invalid email or password', context?: ErrorContext) {
    super(message, AuthErrorCode.AUTH_INVALID_CREDENTIALS, { context });
  }
}

export class MfaRequiredError extends AuthenticationError {
  constructor(
    message = 'Multi-factor authentication required',
    details?: { methods?: string[] }
  ) {
    super(message, AuthErrorCode.AUTH_MFA_REQUIRED, {
      details: { metadata: details },
    });
  }
}

// =============================================================================
// Authorization Errors
// =============================================================================

export class AuthorizationError extends BaseError {
  constructor(
    message = 'Access denied',
    code: AuthorizationErrorCode = AuthorizationErrorCode.AUTHZ_FORBIDDEN,
    options?: {
      details?: ErrorDetails;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'warn',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(
    requiredPermission?: string,
    resource?: string,
    context?: ErrorContext
  ) {
    const message = requiredPermission
      ? `Permission '${requiredPermission}' required${resource ? ` for ${resource}` : ''}`
      : 'Insufficient permissions';
    super(message, AuthorizationErrorCode.AUTHZ_INSUFFICIENT_PERMISSIONS, {
      details: { metadata: { requiredPermission, resource } },
      context,
    });
  }
}

export class SubscriptionRequiredError extends AuthorizationError {
  constructor(
    feature?: string,
    requiredPlan?: string,
    context?: ErrorContext
  ) {
    const message = feature
      ? `Subscription required to access '${feature}'`
      : 'Subscription required';
    super(message, AuthorizationErrorCode.AUTHZ_SUBSCRIPTION_REQUIRED, {
      details: { metadata: { feature, requiredPlan } },
      context,
    });
  }
}

// =============================================================================
// Validation Errors
// =============================================================================

export class ValidationError extends BaseError {
  public readonly fieldErrors: FieldError[];

  constructor(
    message = 'Validation failed',
    fieldErrors: FieldError[] = [],
    options?: {
      code?: ValidationErrorCode;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, options?.code ?? ValidationErrorCode.VALIDATION_FAILED, {
      statusCode: HttpStatusCode.BAD_REQUEST,
      details: { fieldErrors },
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: true,
        shouldLog: false,
        logLevel: 'debug',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
    this.fieldErrors = fieldErrors;
  }

  /**
   * Create a validation error for a single field
   */
  static forField(field: string, message: string, rule?: string): ValidationError {
    return new ValidationError(`Validation failed for '${field}'`, [
      { field, message, rule },
    ]);
  }

  /**
   * Create a validation error for required field
   */
  static required(field: string): ValidationError {
    return new ValidationError(`'${field}' is required`, [
      { field, message: 'This field is required', rule: 'required' },
    ], { code: ValidationErrorCode.VALIDATION_REQUIRED_FIELD });
  }

  /**
   * Create a validation error for invalid format
   */
  static invalidFormat(field: string, expectedFormat: string): ValidationError {
    return new ValidationError(`'${field}' has invalid format`, [
      { field, message: `Expected format: ${expectedFormat}`, rule: 'format' },
    ], { code: ValidationErrorCode.VALIDATION_INVALID_FORMAT });
  }

  /**
   * Add a field error
   */
  addFieldError(fieldError: FieldError): ValidationError {
    return new ValidationError(this.message, [...this.fieldErrors, fieldError], {
      context: this.context,
    });
  }
}

// =============================================================================
// Resource Errors
// =============================================================================

export class ResourceNotFoundError extends BaseError {
  public readonly resourceType: string;
  public readonly resourceId?: string;

  constructor(
    resourceType: string,
    resourceId?: string,
    options?: { context?: ErrorContext; cause?: Error }
  ) {
    const message = resourceId
      ? `${resourceType} with ID '${resourceId}' not found`
      : `${resourceType} not found`;
    super(message, ResourceErrorCode.RESOURCE_NOT_FOUND, {
      statusCode: HttpStatusCode.NOT_FOUND,
      details: { resourceType, resourceId },
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: true,
        shouldLog: false,
        logLevel: 'debug',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export class ResourceAlreadyExistsError extends BaseError {
  constructor(
    resourceType: string,
    identifier?: string,
    options?: { context?: ErrorContext; cause?: Error }
  ) {
    const message = identifier
      ? `${resourceType} '${identifier}' already exists`
      : `${resourceType} already exists`;
    super(message, ResourceErrorCode.RESOURCE_ALREADY_EXISTS, {
      statusCode: HttpStatusCode.CONFLICT,
      details: { resourceType, metadata: { identifier } },
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: true,
        shouldLog: false,
        logLevel: 'debug',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
  }
}

export class ResourceConflictError extends BaseError {
  constructor(
    message: string,
    options?: {
      resourceType?: string;
      resourceId?: string;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, ResourceErrorCode.RESOURCE_CONFLICT, {
      statusCode: HttpStatusCode.CONFLICT,
      details: {
        resourceType: options?.resourceType,
        resourceId: options?.resourceId,
      },
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'warn',
        shouldReport: false,
        exposeDetails: true,
        retryable: true,
      },
    });
  }
}

// =============================================================================
// Business Logic Errors
// =============================================================================

export class BusinessError extends BaseError {
  constructor(
    message: string,
    code: BusinessErrorCode = BusinessErrorCode.BUSINESS_RULE_VIOLATION,
    options?: {
      details?: ErrorDetails;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, code, {
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      details: options?.details,
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'info',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
  }
}

export class PaymentError extends BusinessError {
  constructor(
    message: string,
    options?: {
      details?: ErrorDetails;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, BusinessErrorCode.BUSINESS_PAYMENT_FAILED, options);
  }
}

export class InsufficientBalanceError extends BusinessError {
  constructor(
    required: number,
    available: number,
    currency: string,
    context?: ErrorContext
  ) {
    super(
      `Insufficient balance: required ${currency} ${required}, available ${currency} ${available}`,
      BusinessErrorCode.BUSINESS_INSUFFICIENT_BALANCE,
      {
        details: { metadata: { required, available, currency } },
        context,
      }
    );
  }
}

// =============================================================================
// External Service Errors
// =============================================================================

export class ExternalServiceError extends BaseError {
  public readonly serviceName: string;

  constructor(
    serviceName: string,
    message: string,
    code: ExternalServiceErrorCode = ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR,
    options?: {
      details?: ErrorDetails;
      context?: ErrorContext;
      cause?: Error;
      retryable?: boolean;
    }
  ) {
    super(message, code, {
      statusCode: HttpStatusCode.BAD_GATEWAY,
      details: { ...options?.details, metadata: { ...options?.details?.metadata, serviceName } },
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'error',
        shouldReport: true,
        exposeDetails: false,
        retryable: options?.retryable ?? true,
      },
    });
    this.serviceName = serviceName;
  }
}

export class ServiceTimeoutError extends ExternalServiceError {
  constructor(
    serviceName: string,
    timeoutMs: number,
    context?: ErrorContext
  ) {
    super(
      serviceName,
      `${serviceName} request timed out after ${timeoutMs}ms`,
      ExternalServiceErrorCode.EXTERNAL_SERVICE_TIMEOUT,
      {
        details: { metadata: { timeoutMs } },
        context,
        retryable: true,
      }
    );
  }
}

export class ServiceUnavailableError extends ExternalServiceError {
  constructor(serviceName: string, context?: ErrorContext) {
    super(
      serviceName,
      `${serviceName} is currently unavailable`,
      ExternalServiceErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      { context, retryable: true }
    );
  }
}

// =============================================================================
// Rate Limit Errors
// =============================================================================

export class RateLimitError extends BaseError {
  public readonly retryAfter: number;
  public readonly limit: number;
  public readonly remaining: number;

  constructor(
    message = 'Too many requests',
    options: {
      retryAfter: number;
      limit: number;
      remaining?: number;
      limitType?: 'ip' | 'user' | 'api_key' | 'endpoint';
      context?: ErrorContext;
    }
  ) {
    super(message, RateLimitErrorCode.RATE_LIMIT_EXCEEDED, {
      statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
      details: {
        rateLimit: {
          limit: options.limit,
          remaining: options.remaining ?? 0,
          resetAt: Math.floor(Date.now() / 1000) + options.retryAfter,
          retryAfter: options.retryAfter,
          limitType: options.limitType,
        },
        retry: {
          retryable: true,
          retryAfter: options.retryAfter,
        },
      },
      context: options.context,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'warn',
        shouldReport: false,
        exposeDetails: true,
        retryable: true,
      },
    });
    this.retryAfter = options.retryAfter;
    this.limit = options.limit;
    this.remaining = options.remaining ?? 0;
  }
}

// =============================================================================
// Server Errors
// =============================================================================

export class InternalServerError extends BaseError {
  constructor(
    message = 'An internal server error occurred',
    options?: {
      code?: ServerErrorCode;
      details?: ErrorDetails;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, options?.code ?? ServerErrorCode.SERVER_INTERNAL_ERROR, {
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      details: options?.details,
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: false,
        shouldLog: true,
        logLevel: 'error',
        shouldReport: true,
        exposeDetails: false,
        retryable: false,
      },
    });
  }
}

export class DatabaseError extends InternalServerError {
  constructor(
    message: string,
    options?: { context?: ErrorContext; cause?: Error }
  ) {
    super(message, {
      code: ServerErrorCode.SERVER_DATABASE_ERROR,
      context: options?.context,
      cause: options?.cause,
    });
  }
}

export class NotImplementedError extends BaseError {
  constructor(feature: string, context?: ErrorContext) {
    super(`'${feature}' is not yet implemented`, ServerErrorCode.SERVER_NOT_IMPLEMENTED, {
      statusCode: HttpStatusCode.NOT_IMPLEMENTED,
      context,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'warn',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
  }
}

export class MaintenanceModeError extends BaseError {
  constructor(
    estimatedEndTime?: Date,
    message = 'Service is under maintenance'
  ) {
    super(message, ServerErrorCode.SERVER_MAINTENANCE_MODE, {
      statusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
      details: {
        retry: {
          retryable: true,
          retryAfter: estimatedEndTime
            ? Math.ceil((estimatedEndTime.getTime() - Date.now()) / 1000)
            : 300,
        },
        metadata: {
          estimatedEndTime: estimatedEndTime?.toISOString(),
        },
      },
      metadata: {
        isOperational: true,
        shouldLog: false,
        logLevel: 'info',
        shouldReport: false,
        exposeDetails: true,
        retryable: true,
      },
    });
  }
}

// =============================================================================
// Media Errors
// =============================================================================

export class MediaError extends BaseError {
  constructor(
    message: string,
    code: MediaErrorCode = MediaErrorCode.MEDIA_PROCESSING_FAILED,
    options?: {
      details?: ErrorDetails;
      context?: ErrorContext;
      cause?: Error;
    }
  ) {
    super(message, code, {
      details: options?.details,
      context: options?.context,
      cause: options?.cause,
      metadata: {
        isOperational: true,
        shouldLog: true,
        logLevel: 'warn',
        shouldReport: false,
        exposeDetails: true,
        retryable: false,
      },
    });
  }
}

export class MediaUploadError extends MediaError {
  constructor(
    message: string,
    options?: { details?: ErrorDetails; context?: ErrorContext; cause?: Error }
  ) {
    super(message, MediaErrorCode.MEDIA_UPLOAD_FAILED, options);
  }
}

export class FileTooLargeError extends MediaError {
  constructor(
    actualSize: number,
    maxSize: number,
    options?: { context?: ErrorContext }
  ) {
    super(
      `File size ${formatBytes(actualSize)} exceeds maximum allowed size of ${formatBytes(maxSize)}`,
      MediaErrorCode.MEDIA_TOO_LARGE,
      {
        details: { metadata: { actualSize, maxSize } },
        context: options?.context,
      }
    );
  }
}

export class InvalidMediaFormatError extends MediaError {
  constructor(
    actualFormat: string,
    allowedFormats: string[],
    options?: { context?: ErrorContext }
  ) {
    super(
      `Format '${actualFormat}' is not allowed. Allowed formats: ${allowedFormats.join(', ')}`,
      MediaErrorCode.MEDIA_INVALID_FORMAT,
      {
        details: { metadata: { actualFormat, allowedFormats } },
        context: options?.context,
      }
    );
  }
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
