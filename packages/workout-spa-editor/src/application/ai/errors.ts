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

/** A model binding must name a model; a blank one would call no model. */
export class EmptyModelIdError extends Error {
  override readonly name = "EmptyModelIdError";
  constructor() {
    super("A model binding needs a model id");
  }
}
