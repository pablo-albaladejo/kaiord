/**
 * bridgeId → `coachingSyncState.source` key.
 *
 * Every bridge but one stores its freshness row under its own bridgeId.
 * `train2go-bridge` writes `"train2go"` because the planned-session import
 * predates the bridge-id vocabulary, and the rows already on users' devices
 * carry that key — renaming it would orphan them. The map exists so no
 * caller has to remember the exception.
 */

export const BRIDGE_SYNC_SOURCES: Record<string, string> = {
  "garmin-bridge": "garmin-bridge",
  "whoop-bridge": "whoop-bridge",
  "train2go-bridge": "train2go",
  "tanita-bridge": "tanita-bridge",
  "trainingpeaks-bridge": "trainingpeaks-bridge",
};

/** Falls back to the bridgeId so an unmapped bridge still reads coherently. */
export const syncSourceFor = (bridgeId: string): string =>
  BRIDGE_SYNC_SOURCES[bridgeId] ?? bridgeId;
