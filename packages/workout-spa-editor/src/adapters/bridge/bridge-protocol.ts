/**
 * The Bridge protocol versions the Kaiord App answers to, per extension: its
 * current version and the one before it, so an extension still waiting for
 * its store update keeps working (docs/adr/0004-thin-bridge-smart-connector.md).
 * Train2Go moved to 2 (the thin Bridge); every other extension is on 1.
 */
const CURRENT_AND_PREVIOUS: Readonly<Record<string, readonly number[]>> = {
  "train2go-bridge": [1, 2],
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
