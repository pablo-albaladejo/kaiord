// Typed error classes with stable message prefixes. The workflow greps
// these prefixes from stderr to decide between cws-auth-broken vs
// verification-timeout vs rejected vs generic state errors.

export const ERROR_PREFIX = {
  AUTH: "[CwsAuthError]",
  STATE: "[CwsStateError]",
  TIMEOUT: "[CwsTimeoutError]",
};

export class CwsAuthError extends Error {
  constructor(message) {
    super(`${ERROR_PREFIX.AUTH} ${message}`);
    this.name = "CwsAuthError";
  }
}

export class CwsStateError extends Error {
  constructor(message) {
    super(`${ERROR_PREFIX.STATE} ${message}`);
    this.name = "CwsStateError";
  }
}

export class CwsTimeoutError extends Error {
  constructor(message) {
    super(`${ERROR_PREFIX.TIMEOUT} ${message}`);
    this.name = "CwsTimeoutError";
  }
}
