/**
 * Domain errors for the AI provider use cases. Components catch these
 * to surface a precise message instead of a generic "something went
 * wrong" toast.
 */

export class ProviderNotFoundError extends Error {
  override readonly name = "ProviderNotFoundError";
  readonly providerId: string;
  constructor(providerId: string) {
    super(`AI provider not found: ${providerId}`);
    this.providerId = providerId;
  }
}
