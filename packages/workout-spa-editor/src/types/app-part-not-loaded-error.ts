/**
 * A part of the App loaded on first use could not be fetched, so nothing
 * was asked of any Platform. Reloading the App fetches it again.
 */
export class AppPartNotLoadedError extends Error {
  constructor() {
    super("A part of the App could not be loaded");
    this.name = "AppPartNotLoadedError";
  }
}

export const isAppPartNotLoaded = (
  error: unknown
): error is AppPartNotLoadedError => error instanceof AppPartNotLoadedError;
