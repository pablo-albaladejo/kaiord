/**
 * syncTanitaImport — governed import of MyTANITA export-CSV readings into the
 * SPA's own weight + body-composition stores.
 *
 * The pre-existing `syncTanitaBodyComposition` PUSHES Tanita data to Garmin;
 * this is the inbound half: it persists the same CSV locally, gated per data
 * type on the import policy resolver BEFORE reading the bridge. With neither
 * `weight ← tanita-bridge` nor `body-composition ← tanita-bridge` enabled the
 * pull never touches the bridge. Records dedupe by `(sourceBridgeId,
 * externalId)` where `externalId` hashes `(dataType, measuredAt)`. Pure
 * application layer: the bridge read and the `@kaiord/tanita` parser are both
 * injected.
 */
import type { KRD } from "@kaiord/core";

import { resolveImportPolicies } from "../integration-policy/resolve-import-policies.use-case";
import {
  persistPendingRecords,
  type SyncTanitaImportDeps,
  type SyncTanitaImportInput,
  type SyncTanitaImportResult,
  TANITA_BRIDGE_ID,
  type TanitaImportFlags,
} from "./tanita-import-records";

export type {
  SyncTanitaImportDeps,
  SyncTanitaImportInput,
  SyncTanitaImportResult,
};

const resolveFlags = async (
  deps: SyncTanitaImportDeps,
  profileId: string
): Promise<TanitaImportFlags> => {
  const enabledFor = async (
    dataType: "weight" | "body-composition"
  ): Promise<boolean> => {
    const policies = await resolveImportPolicies(
      { policyRepo: deps.policyRepo },
      { profileId, dataType }
    );
    return policies.some((p) => p.enabled && p.bridgeId === TANITA_BRIDGE_ID);
  };
  const [weight, bodyComposition] = await Promise.all([
    enabledFor("weight"),
    enabledFor("body-composition"),
  ]);
  return { weight, bodyComposition };
};

export const syncTanitaImport = async (
  deps: SyncTanitaImportDeps,
  input: SyncTanitaImportInput
): Promise<SyncTanitaImportResult> => {
  const flags = await resolveFlags(deps, input.profileId);
  if (!flags.weight && !flags.bodyComposition) {
    return { ok: false, reason: "no-policy" };
  }

  let documents: KRD[];
  try {
    documents = deps.parse(await deps.readCsv());
  } catch (err) {
    return {
      ok: false,
      reason: "transport-error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const counts = await persistPendingRecords(
    deps.importedRecords,
    input.profileId,
    documents,
    flags
  );
  return { ok: true, ...counts };
};
