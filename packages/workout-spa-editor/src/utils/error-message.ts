/** The text of a caught value: an Error's message, anything else stringified. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
