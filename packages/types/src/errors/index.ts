// =============================================================================
// Error Types - Main Entry Point
// =============================================================================

// Error code enums and constants
export {
  AuthErrorCode,
  AuthorizationErrorCode,
  ValidationErrorCode,
  ResourceErrorCode,
  BusinessErrorCode,
  ExternalServiceErrorCode,
  RateLimitErrorCode,
  ServerErrorCode,
  MediaErrorCode,
  ErrorCodes,
  type ErrorCode,
} from './codes';

// HTTP status codes and mappings
export {
  HttpStatusCode,
  errorCodeToHttpStatus,
  getHttpStatusForErrorCode,
  isClientError,
  isServerError,
  isSuccess,
  httpStatusText,
} from './http-status';

// Error response types
export type {
  ApiErrorResponse,
  ErrorDetails,
  FieldError,
  RateLimitInfo,
  RetryInfo,
  ErrorContext,
  SerializedError,
  ErrorMetadata,
  ErrorMessageMap,
  ErrorLike,
  CreateErrorResponseOptions,
  ErrorResult,
  AsyncErrorResult,
} from './types';
