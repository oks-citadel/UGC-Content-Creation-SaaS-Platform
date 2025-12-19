// =============================================================================
// Retry Utilities
// =============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const defaultOptions: Required<Omit<RetryOptions, 'retryCondition' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitter: true,
};

function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffFactor: number,
  jitter: boolean
): number {
  let delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
  delay = Math.min(delay, maxDelayMs);

  if (jitter) {
    delay = delay * (0.5 + Math.random());
  }

  return Math.floor(delay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts, initialDelayMs, maxDelayMs, backoffFactor, jitter } = {
    ...defaultOptions,
    ...options,
  };

  const { retryCondition, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      if (retryCondition && !retryCondition(error, attempt)) {
        break;
      }

      const delayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffFactor, jitter);

      if (onRetry) {
        onRetry(error, attempt, delayMs);
      }

      await sleep(delayMs);
    }
  }

  throw lastError;
}

// Specific retry strategies
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  return retry(fn, {
    maxAttempts,
    initialDelayMs: 1000,
    backoffFactor: 2,
    jitter: true,
  });
}

export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  return retry(fn, {
    maxAttempts,
    initialDelayMs: delayMs,
    backoffFactor: 1,
    jitter: false,
  });
}

export async function retryWithFixedDelay<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  return retry(fn, {
    maxAttempts,
    initialDelayMs: delayMs,
    maxDelayMs: delayMs,
    backoffFactor: 1,
    jitter: false,
  });
}

// HTTP-specific retry
export function isRetryableHttpError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    // Retry on 408, 429, 500, 502, 503, 504
    return [408, 429, 500, 502, 503, 504].includes(status);
  }
  return false;
}

export async function retryHttpRequest<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  return retry(fn, {
    maxAttempts,
    initialDelayMs: 1000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: isRetryableHttpError,
  });
}

// Circuit breaker
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxAttempts?: number;
}

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime?: number;
  private halfOpenAttempts = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenMaxAttempts: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? 3;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        this.halfOpenAttempts = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.resetTimeoutMs;
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open' || this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  private reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = undefined;
  }

  getState(): CircuitState {
    return this.state;
  }

  isOpen(): boolean {
    return this.state === 'open';
  }

  isClosed(): boolean {
    return this.state === 'closed';
  }
}

// Timeout wrapper
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Debounce async function
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let pendingPromise: Promise<ReturnType<T>> | undefined;
  let pendingResolve: ((value: ReturnType<T>) => void) | undefined;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise<ReturnType<T>>((resolve) => {
        pendingResolve = resolve;
      });
    }

    timeoutId = setTimeout(async () => {
      const result = (await fn(...args)) as ReturnType<T>;
      pendingResolve!(result);
      pendingPromise = undefined;
      pendingResolve = undefined;
    }, delayMs);

    return pendingPromise;
  };
}
