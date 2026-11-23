/**
 * The Bridge protocol versions the Kaiord App answers to, per extension: its
 * descriptor's current version and the one before it, so an extension still
 * waiting for its store update keeps working
 * (docs/adr/0004-thin-bridge-smart-connector.md). An unknown extension is
 * answered on version 1 only.
 */
import { extensionOf } from "../../application/connections/extension-descriptors";

const ONLY_VERSION_ONE: readonly number[] = [1];

export const acceptedBridgeProtocols = (bridgeId: string): readonly number[] =>
  extensionOf(bridgeId)?.protocols ?? ONLY_VERSION_ONE;

export const isAcceptedBridgeProtocol = (
  bridgeId: string,
  version: unknown
): boolean =>
  typeof version === "number" &&
  acceptedBridgeProtocols(bridgeId).includes(version);
