/**
 * Application Error class for standardized error handling
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    codeOrStatusCode: string | number = 500,
    statusCode?: number,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Handle two-arg call: new AppError('message', 404)
    if (typeof codeOrStatusCode === 'number') {
      this.statusCode = codeOrStatusCode;
      this.code = this.getCodeFromStatus(codeOrStatusCode);
    } else {
      this.code = codeOrStatusCode;
      this.statusCode = statusCode ?? 500;
    }

    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  private getCodeFromStatus(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_ERROR',
    };
    return codes[status] || 'ERROR';
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

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
