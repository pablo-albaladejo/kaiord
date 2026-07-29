/**
 * Supported-route filter — narrows a bridge's announced capability token to
 * the (dataType, direction) routes the SPA importer/exporter ACTUALLY serves.
 *
 * Bridges without an entry here are unrestricted: their capability tokens are
 * already precise enough to derive eligibility from. Entries exist only where
 * a SHARED token over-claims — `read:body` spans weight, hrv, daily-wellness,
 * body-composition and stress, so a bridge announcing it would otherwise be
 * offered a route on the Connections page for types it can never deliver.
 *
 * INVARIANT — an ABSENT key and an EMPTY array mean opposite things: absent =
 * "every route this bridge's tokens allow", `[]` = "no route at all". Deleting
 * an entry therefore silently UNRESTRICTS that bridge rather than disabling
 * it; narrow by editing the array, never by removing the key.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicyDirection } from "../types/integration-policy";

/** Tanita reads the MyTANITA export CSV: weight + body-composition only. */
const SUPPORTED_IMPORT_TYPES: Record<string, readonly ManagedDataType[]> = {
  "tanita-bridge": ["weight", "body-composition"],
  // consolidatedtimedmetrics maps the weight channel (type 9) only; pulse /
  // HRV / sleep / spo2 remain deferred in @kaiord/trainingpeaks.
  "trainingpeaks-bridge": ["weight"],
};

/** TrainingPeaks announces `write:body` but the SPA cables no push yet. */
const SUPPORTED_EXPORT_TYPES: Record<string, readonly ManagedDataType[]> = {
  "trainingpeaks-bridge": [],
};

export const bridgeSupportsRoute = (
  bridgeId: string,
  dataType: ManagedDataType,
  direction: IntegrationPolicyDirection
): boolean => {
  const map =
    direction === "import" ? SUPPORTED_IMPORT_TYPES : SUPPORTED_EXPORT_TYPES;
  const supported = map[bridgeId];
  return supported === undefined ? true : supported.includes(dataType);
};
