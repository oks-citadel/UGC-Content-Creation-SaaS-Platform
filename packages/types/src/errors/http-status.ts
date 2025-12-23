// =============================================================================
// HTTP Status Code Mappings
// =============================================================================

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
  type ErrorCode,
} from './codes';

/**
 * Standard HTTP status codes used in the API
 */
export enum HttpStatusCode {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 3xx Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  UNPROCESSABLE_ENTITY = 422,
  LOCKED = 423,
  FAILED_DEPENDENCY = 424,
  TOO_EARLY = 425,
  UPGRADE_REQUIRED = 426,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  INSUFFICIENT_STORAGE = 507,
  LOOP_DETECTED = 508,
  BANDWIDTH_LIMIT_EXCEEDED = 509,
  NOT_EXTENDED = 510,
  NETWORK_AUTHENTICATION_REQUIRED = 511,
}

/**
 * Mapping of error codes to HTTP status codes
 */
export const errorCodeToHttpStatus: Record<ErrorCode, HttpStatusCode> = {
  // Auth errors -> 401 Unauthorized
  [AuthErrorCode.AUTH_TOKEN_EXPIRED]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_TOKEN_INVALID]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_TOKEN_MISSING]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_TOKEN_REVOKED]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_REFRESH_TOKEN_INVALID]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_INVALID_CREDENTIALS]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_INVALID_PASSWORD]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_PASSWORD_MISMATCH]: HttpStatusCode.BAD_REQUEST,
  [AuthErrorCode.AUTH_PASSWORD_TOO_WEAK]: HttpStatusCode.BAD_REQUEST,
  [AuthErrorCode.AUTH_ACCOUNT_LOCKED]: HttpStatusCode.FORBIDDEN,
  [AuthErrorCode.AUTH_ACCOUNT_DISABLED]: HttpStatusCode.FORBIDDEN,
  [AuthErrorCode.AUTH_ACCOUNT_NOT_VERIFIED]: HttpStatusCode.FORBIDDEN,
  [AuthErrorCode.AUTH_ACCOUNT_SUSPENDED]: HttpStatusCode.FORBIDDEN,
  [AuthErrorCode.AUTH_EMAIL_NOT_VERIFIED]: HttpStatusCode.FORBIDDEN,
  [AuthErrorCode.AUTH_MFA_REQUIRED]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_MFA_INVALID_CODE]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_MFA_SETUP_REQUIRED]: HttpStatusCode.FORBIDDEN,
  [AuthErrorCode.AUTH_SESSION_EXPIRED]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_SESSION_INVALID]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_SESSION_LIMIT_EXCEEDED]: HttpStatusCode.FORBIDDEN,
  [AuthErrorCode.AUTH_OAUTH_FAILED]: HttpStatusCode.UNAUTHORIZED,
  [AuthErrorCode.AUTH_OAUTH_ACCOUNT_EXISTS]: HttpStatusCode.CONFLICT,
  [AuthErrorCode.AUTH_OAUTH_PROVIDER_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [AuthErrorCode.AUTH_OAUTH_TOKEN_EXCHANGE_FAILED]: HttpStatusCode.BAD_GATEWAY,

  // Authorization errors -> 403 Forbidden
  [AuthorizationErrorCode.AUTHZ_FORBIDDEN]: HttpStatusCode.FORBIDDEN,
  [AuthorizationErrorCode.AUTHZ_INSUFFICIENT_PERMISSIONS]: HttpStatusCode.FORBIDDEN,
  [AuthorizationErrorCode.AUTHZ_ROLE_REQUIRED]: HttpStatusCode.FORBIDDEN,
  [AuthorizationErrorCode.AUTHZ_RESOURCE_ACCESS_DENIED]: HttpStatusCode.FORBIDDEN,
  [AuthorizationErrorCode.AUTHZ_ORGANIZATION_ACCESS_DENIED]: HttpStatusCode.FORBIDDEN,
  [AuthorizationErrorCode.AUTHZ_SUBSCRIPTION_REQUIRED]: HttpStatusCode.PAYMENT_REQUIRED,
  [AuthorizationErrorCode.AUTHZ_FEATURE_DISABLED]: HttpStatusCode.FORBIDDEN,
  [AuthorizationErrorCode.AUTHZ_QUOTA_EXCEEDED]: HttpStatusCode.FORBIDDEN,

  // Validation errors -> 400 Bad Request
  [ValidationErrorCode.VALIDATION_FAILED]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_REQUIRED_FIELD]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_FORMAT]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_TYPE]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_LENGTH]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_RANGE]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_ENUM]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_EMAIL]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_URL]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_UUID]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_DATE]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_JSON]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_INVALID_FILE]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_FILE_TOO_LARGE]: HttpStatusCode.PAYLOAD_TOO_LARGE,
  [ValidationErrorCode.VALIDATION_FILE_TYPE_NOT_ALLOWED]: HttpStatusCode.UNSUPPORTED_MEDIA_TYPE,
  [ValidationErrorCode.VALIDATION_ARRAY_TOO_LONG]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_ARRAY_TOO_SHORT]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_DUPLICATE_VALUE]: HttpStatusCode.BAD_REQUEST,
  [ValidationErrorCode.VALIDATION_CONSTRAINT_VIOLATION]: HttpStatusCode.UNPROCESSABLE_ENTITY,

  // Resource errors
  [ResourceErrorCode.RESOURCE_NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [ResourceErrorCode.RESOURCE_ALREADY_EXISTS]: HttpStatusCode.CONFLICT,
  [ResourceErrorCode.RESOURCE_DELETED]: HttpStatusCode.GONE,
  [ResourceErrorCode.RESOURCE_LOCKED]: HttpStatusCode.LOCKED,
  [ResourceErrorCode.RESOURCE_CONFLICT]: HttpStatusCode.CONFLICT,
  [ResourceErrorCode.RESOURCE_VERSION_CONFLICT]: HttpStatusCode.CONFLICT,
  [ResourceErrorCode.RESOURCE_LIMIT_EXCEEDED]: HttpStatusCode.FORBIDDEN,
  [ResourceErrorCode.RESOURCE_QUOTA_EXCEEDED]: HttpStatusCode.FORBIDDEN,
  [ResourceErrorCode.RESOURCE_DEPENDENCY_ERROR]: HttpStatusCode.FAILED_DEPENDENCY,
  [ResourceErrorCode.RESOURCE_INVALID_STATE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ResourceErrorCode.RESOURCE_OPERATION_NOT_ALLOWED]: HttpStatusCode.METHOD_NOT_ALLOWED,

  // Business errors -> 422 Unprocessable Entity or 400
  [BusinessErrorCode.BUSINESS_RULE_VIOLATION]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_CAMPAIGN_INACTIVE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_CAMPAIGN_CLOSED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_CAMPAIGN_FULL]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_APPLICATION_ALREADY_EXISTS]: HttpStatusCode.CONFLICT,
  [BusinessErrorCode.BUSINESS_APPLICATION_NOT_ELIGIBLE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_DELIVERABLE_DEADLINE_PASSED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_CONTENT_NOT_APPROVED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_PAYMENT_FAILED]: HttpStatusCode.PAYMENT_REQUIRED,
  [BusinessErrorCode.BUSINESS_INSUFFICIENT_BALANCE]: HttpStatusCode.PAYMENT_REQUIRED,
  [BusinessErrorCode.BUSINESS_WITHDRAWAL_LIMIT_EXCEEDED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_CREATOR_NOT_VERIFIED]: HttpStatusCode.FORBIDDEN,
  [BusinessErrorCode.BUSINESS_STORE_NOT_CONNECTED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [BusinessErrorCode.BUSINESS_PRODUCT_UNAVAILABLE]: HttpStatusCode.UNPROCESSABLE_ENTITY,

  // External service errors -> 502/503
  [ExternalServiceErrorCode.EXTERNAL_SERVICE_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ExternalServiceErrorCode.EXTERNAL_SERVICE_TIMEOUT]: HttpStatusCode.GATEWAY_TIMEOUT,
  [ExternalServiceErrorCode.EXTERNAL_API_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_API_RATE_LIMITED]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ExternalServiceErrorCode.EXTERNAL_PAYMENT_PROVIDER_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_STORAGE_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_EMAIL_DELIVERY_FAILED]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_SMS_DELIVERY_FAILED]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_WEBHOOK_DELIVERY_FAILED]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_AI_SERVICE_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_SOCIAL_PLATFORM_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ExternalServiceErrorCode.EXTERNAL_ECOMMERCE_PLATFORM_ERROR]: HttpStatusCode.BAD_GATEWAY,

  // Rate limit errors -> 429 Too Many Requests
  [RateLimitErrorCode.RATE_LIMIT_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [RateLimitErrorCode.RATE_LIMIT_IP_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [RateLimitErrorCode.RATE_LIMIT_USER_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [RateLimitErrorCode.RATE_LIMIT_API_KEY_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [RateLimitErrorCode.RATE_LIMIT_ENDPOINT_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,

  // Server errors -> 500
  [ServerErrorCode.SERVER_INTERNAL_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ServerErrorCode.SERVER_DATABASE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ServerErrorCode.SERVER_CACHE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ServerErrorCode.SERVER_QUEUE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ServerErrorCode.SERVER_CONFIGURATION_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ServerErrorCode.SERVER_MAINTENANCE_MODE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ServerErrorCode.SERVER_OVERLOADED]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ServerErrorCode.SERVER_NOT_IMPLEMENTED]: HttpStatusCode.NOT_IMPLEMENTED,
  [ServerErrorCode.SERVER_FEATURE_DISABLED]: HttpStatusCode.NOT_IMPLEMENTED,

  // Media errors
  [MediaErrorCode.MEDIA_UPLOAD_FAILED]: HttpStatusCode.BAD_REQUEST,
  [MediaErrorCode.MEDIA_PROCESSING_FAILED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [MediaErrorCode.MEDIA_ENCODING_FAILED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [MediaErrorCode.MEDIA_TRANSCODING_FAILED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [MediaErrorCode.MEDIA_THUMBNAIL_GENERATION_FAILED]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [MediaErrorCode.MEDIA_INVALID_FORMAT]: HttpStatusCode.UNSUPPORTED_MEDIA_TYPE,
  [MediaErrorCode.MEDIA_CORRUPTED]: HttpStatusCode.BAD_REQUEST,
  [MediaErrorCode.MEDIA_TOO_LARGE]: HttpStatusCode.PAYLOAD_TOO_LARGE,
  [MediaErrorCode.MEDIA_DURATION_TOO_LONG]: HttpStatusCode.BAD_REQUEST,
  [MediaErrorCode.MEDIA_RESOLUTION_TOO_HIGH]: HttpStatusCode.BAD_REQUEST,
  [MediaErrorCode.MEDIA_NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [MediaErrorCode.MEDIA_ACCESS_DENIED]: HttpStatusCode.FORBIDDEN,
};

/**
 * Get HTTP status code for an error code
 * Returns 500 Internal Server Error for unknown codes
 */
export function getHttpStatusForErrorCode(code: ErrorCode): HttpStatusCode {
  return errorCodeToHttpStatus[code] ?? HttpStatusCode.INTERNAL_SERVER_ERROR;
}

/**
 * Check if an HTTP status code represents a client error (4xx)
 */
export function isClientError(status: HttpStatusCode): boolean {
  return status >= 400 && status < 500;
}

/**
 * Check if an HTTP status code represents a server error (5xx)
 */
export function isServerError(status: HttpStatusCode): boolean {
  return status >= 500 && status < 600;
}

/**
 * Check if an HTTP status code represents a success (2xx)
 */
export function isSuccess(status: HttpStatusCode): boolean {
  return status >= 200 && status < 300;
}

/**
 * Get human-readable status text for HTTP status codes
 */
export const httpStatusText: Record<HttpStatusCode, string> = {
  [HttpStatusCode.OK]: 'OK',
  [HttpStatusCode.CREATED]: 'Created',
  [HttpStatusCode.ACCEPTED]: 'Accepted',
  [HttpStatusCode.NO_CONTENT]: 'No Content',
  [HttpStatusCode.MOVED_PERMANENTLY]: 'Moved Permanently',
  [HttpStatusCode.FOUND]: 'Found',
  [HttpStatusCode.NOT_MODIFIED]: 'Not Modified',
  [HttpStatusCode.TEMPORARY_REDIRECT]: 'Temporary Redirect',
  [HttpStatusCode.PERMANENT_REDIRECT]: 'Permanent Redirect',
  [HttpStatusCode.BAD_REQUEST]: 'Bad Request',
  [HttpStatusCode.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatusCode.PAYMENT_REQUIRED]: 'Payment Required',
  [HttpStatusCode.FORBIDDEN]: 'Forbidden',
  [HttpStatusCode.NOT_FOUND]: 'Not Found',
  [HttpStatusCode.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [HttpStatusCode.NOT_ACCEPTABLE]: 'Not Acceptable',
  [HttpStatusCode.CONFLICT]: 'Conflict',
  [HttpStatusCode.GONE]: 'Gone',
  [HttpStatusCode.LENGTH_REQUIRED]: 'Length Required',
  [HttpStatusCode.PRECONDITION_FAILED]: 'Precondition Failed',
  [HttpStatusCode.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
  [HttpStatusCode.URI_TOO_LONG]: 'URI Too Long',
  [HttpStatusCode.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
  [HttpStatusCode.RANGE_NOT_SATISFIABLE]: 'Range Not Satisfiable',
  [HttpStatusCode.EXPECTATION_FAILED]: 'Expectation Failed',
  [HttpStatusCode.IM_A_TEAPOT]: "I'm a Teapot",
  [HttpStatusCode.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatusCode.LOCKED]: 'Locked',
  [HttpStatusCode.FAILED_DEPENDENCY]: 'Failed Dependency',
  [HttpStatusCode.TOO_EARLY]: 'Too Early',
  [HttpStatusCode.UPGRADE_REQUIRED]: 'Upgrade Required',
  [HttpStatusCode.PRECONDITION_REQUIRED]: 'Precondition Required',
  [HttpStatusCode.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatusCode.REQUEST_HEADER_FIELDS_TOO_LARGE]: 'Request Header Fields Too Large',
  [HttpStatusCode.UNAVAILABLE_FOR_LEGAL_REASONS]: 'Unavailable For Legal Reasons',
  [HttpStatusCode.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatusCode.NOT_IMPLEMENTED]: 'Not Implemented',
  [HttpStatusCode.BAD_GATEWAY]: 'Bad Gateway',
  [HttpStatusCode.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HttpStatusCode.GATEWAY_TIMEOUT]: 'Gateway Timeout',
  [HttpStatusCode.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP Version Not Supported',
  [HttpStatusCode.INSUFFICIENT_STORAGE]: 'Insufficient Storage',
  [HttpStatusCode.LOOP_DETECTED]: 'Loop Detected',
  [HttpStatusCode.BANDWIDTH_LIMIT_EXCEEDED]: 'Bandwidth Limit Exceeded',
  [HttpStatusCode.NOT_EXTENDED]: 'Not Extended',
  [HttpStatusCode.NETWORK_AUTHENTICATION_REQUIRED]: 'Network Authentication Required',
};
