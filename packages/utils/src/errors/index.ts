// =============================================================================
// Error Utilities - Main Entry Point
// =============================================================================

// Base error class
export { BaseError } from './base-error';

// Specialized error classes
export {
  // Authentication errors
  AuthenticationError,
  TokenExpiredError,
  InvalidCredentialsError,
  MfaRequiredError,

  // Authorization errors
  AuthorizationError,
  InsufficientPermissionsError,
  SubscriptionRequiredError,

  // Validation errors
  ValidationError,

  // Resource errors
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceConflictError,

  // Business errors
  BusinessError,
  PaymentError,
  InsufficientBalanceError,

  // External service errors
  ExternalServiceError,
  ServiceTimeoutError,
  ServiceUnavailableError,

  // Rate limit errors
  RateLimitError,

  // Server errors
  InternalServerError,
  DatabaseError,
  NotImplementedError,
  MaintenanceModeError,

  // Media errors
  MediaError,
  MediaUploadError,
  FileTooLargeError,
  InvalidMediaFormatError,
} from './error-classes';

// Error response formatter
export {
  formatErrorResponse,
  formatAnyError,
  formatMinimalError,
  generateCorrelationId,
  isErrorLike,
} from './formatter';

// Error mapping utilities
export {
  defaultErrorMessages,
  getErrorMessage,
  mapHttpErrorToBaseError,
  mapStandardErrorToBaseError,
  mapDatabaseErrorToBaseError,
  mapValidationErrorToBaseError,
  isRetryableError,
  isClientError as isClientErrorStatus,
  isServerError as isServerErrorStatus,
} from './mapping';

// Type guards
export {
  // Base guards
  isBaseError,
  isError,
  isOperationalError,

  // Specific error type guards
  isAuthenticationError,
  isAuthorizationError,
  isValidationError,
  isResourceNotFoundError,
  isResourceAlreadyExistsError,
  isResourceConflictError,
  isBusinessError,
  isExternalServiceError,
  isRateLimitError,
  isInternalServerError,
  isMediaError,

  // Error code category guards
  hasAuthErrorCode,
  hasAuthorizationErrorCode,
  hasValidationErrorCode,
  hasResourceErrorCode,
  hasBusinessErrorCode,
  hasExternalServiceErrorCode,
  hasRateLimitErrorCode,
  hasServerErrorCode,
  hasMediaErrorCode,

  // Specific error code guards
  hasErrorCode,
  hasAnyErrorCode,

  // HTTP status guards
  hasStatusCode,
  isClientError,
  isServerError,
  isRetryable,

  // API response guards
  isApiErrorResponse,
  isErrorResponse,

  // Aggregate guards
  requiresAuthentication,
  insufficientPermissions,
  resourceNotFound,
  isRateLimited,
  isExternalFailure,
} from './guards';

// Legacy exports for backward compatibility
// These are deprecated but maintained for existing code
export {
  AppError,
  isAppError,
  isOperationalErrorLegacy,
  formatError,
  wrapError,
  catchAsync,
  ok,
  err,
  isOk,
  isErr,
  type Result,
} from './legacy';
