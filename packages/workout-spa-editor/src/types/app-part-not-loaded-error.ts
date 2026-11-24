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

/** The failure reason a use case answers when its code did not load. */
export const APP_PART_NOT_LOADED = "app-part-not-loaded";

export const isAppPartNotLoadedReason = (reason: string): boolean =>
  reason === APP_PART_NOT_LOADED;
