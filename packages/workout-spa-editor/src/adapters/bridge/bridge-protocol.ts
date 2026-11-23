/**
 * The Bridge protocol versions the Kaiord App answers to, per extension: its
 * current version and the one before it, so an extension still waiting for
 * its store update keeps working (docs/adr/0004-thin-bridge-smart-connector.md).
 * Every extension moved to 2, the thin Bridge (Train2Go first, then Garmin,
 * Tanita, TrainingPeaks and WHOOP); 1 is the store version before it.
 */
const CURRENT_AND_PREVIOUS: Readonly<Record<string, readonly number[]>> = {
  "garmin-bridge": [1, 2],
  "tanita-bridge": [1, 2],
  "train2go-bridge": [1, 2],
  "trainingpeaks-bridge": [1, 2],
  "whoop-bridge": [1, 2],
};

const ONLY_VERSION_ONE: readonly number[] = [1];

export const acceptedBridgeProtocols = (bridgeId: string): readonly number[] =>
  CURRENT_AND_PREVIOUS[bridgeId] ?? ONLY_VERSION_ONE;

export const isAcceptedBridgeProtocol = (
  bridgeId: string,
  version: unknown
): boolean =>
  typeof version === "number" &&
  acceptedBridgeProtocols(bridgeId).includes(version);
