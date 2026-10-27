const ATTEMPT_MARK = "kaiord:stale-schema-reload";

export type MarkStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const sessionMarkStorage = (): MarkStorage | undefined => {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

/** The session already spent its automatic attempt (the loop guard). */
export const hasAttempted = (storage: MarkStorage | undefined): boolean => {
  try {
    return (storage?.getItem(ATTEMPT_MARK) ?? null) !== null;
  } catch {
    return false;
  }
};

export const markAttempted = (storage: MarkStorage | undefined): void => {
  try {
    storage?.setItem(ATTEMPT_MARK, "1");
  } catch {
    // Without storage the loop guard is gone; the reload still helps once.
  }
};

/** Every boot that is not stale gives a later stale event its own attempt. */
export const clearStaleReloadAttempt = (
  storage: MarkStorage | undefined = sessionMarkStorage()
): void => {
  try {
    storage?.removeItem(ATTEMPT_MARK);
  } catch {
    // Nothing to clear without storage.
  }
};
