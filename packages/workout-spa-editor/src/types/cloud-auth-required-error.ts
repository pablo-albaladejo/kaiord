/**
 * The cloud needs a fresh sign-in that cannot happen now: the token expired
 * or was revoked, and Google's sign-in popup only opens from a user gesture.
 * Sync stops until the next click or key press, instead of retrying.
 */
export class CloudAuthRequiredError extends Error {
  constructor() {
    super("Cloud sign-in required");
    this.name = "CloudAuthRequiredError";
  }
}

export const isCloudAuthRequired = (
  error: unknown
): error is CloudAuthRequiredError => error instanceof CloudAuthRequiredError;
