/**
 * When each bridge was last imported from, for the whole browsing session.
 *
 * Module-scoped rather than held in the calling component: the guard protects
 * an extension, so it must outlive the card that happens to render the button.
 * A `useRef` would reset every time the Manage panel was collapsed and
 * reopened, which is one click away from no cooldown at all.
 *
 * In-memory only — this is transient rate-limiting state, not a second copy of
 * the truth on disk (see the bridge persistence boundary).
 */
export const IMPORT_COOLDOWN_MS = 60_000;

const lastImportAt = new Map<string, number>();

export const isCoolingDown = (bridgeId: string, now: number): boolean => {
  const last = lastImportAt.get(bridgeId);
  return last !== undefined && now - last < IMPORT_COOLDOWN_MS;
};

export const markImported = (bridgeId: string, now: number): void => {
  lastImportAt.set(bridgeId, now);
};

/** Test seam: the map is module state, so a suite must be able to clear it. */
export const resetImportCooldowns = (): void => {
  lastImportAt.clear();
};
