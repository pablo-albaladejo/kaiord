/**
 * Error thrown when authentication against a remote service fails.
 */
export class ServiceAuthError extends Error {
  public override readonly name = "ServiceAuthError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceAuthError);
    }
  }
}

export const createServiceAuthError = (
  message: string,
  cause?: unknown
): ServiceAuthError => new ServiceAuthError(message, cause);

/**
 * Error thrown when a remote service API request fails.
 */
export class ServiceApiError extends Error {
  public override readonly name = "ServiceApiError";

  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceApiError);
    }
  }
}

export const createServiceApiError = (
  message: string,
  statusCode?: number,
  cause?: unknown
): ServiceApiError => new ServiceApiError(message, statusCode, cause);
