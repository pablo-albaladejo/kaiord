/**
 * Shared error class for use-case-level input validation. Use cases
 * throw this when an input field is empty/undefined where a non-empty
 * value is required (e.g., dismissAutoMatchBanner rejecting an empty
 * profileId so a degenerate "global dismissal" row cannot land).
 */
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}
