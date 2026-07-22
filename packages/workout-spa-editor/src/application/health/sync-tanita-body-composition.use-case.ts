/**
 * syncTanitaBodyComposition — governed Tanita → Garmin body-composition export.
 *
 * Consults the export route policy BEFORE touching either bridge (fail-closed,
 * mirroring `pullGarminActivities`): without an enabled `body-composition →
 * garmin-bridge` route the sync never reads. When active it reads the MyTANITA
 * CSV, parses it to KRD, encodes each measurement to `weight_scale` FIT bytes,
 * and pushes each through `recordExport` (the export ledger) so re-running the
 * same day SKIPs already-uploaded measurements. A dead mytanita.eu session
 * surfaces as `needs-reauth`. Pure: transports, parser, and encoder are injected.
 */
import { recordExport } from "../export/record-export.use-case";
import { resolveExportPolicies } from "../integration-policy/resolve-export-policies.use-case";
import {
  BODY_COMPOSITION,
  errorMessage,
  GARMIN_BRIDGE_ID,
  GARMIN_UPLOAD_EXTERNAL_ID,
  measurementRecordId,
  readNeedsReauth,
  type SyncTanitaBodyCompositionDeps,
  type SyncTanitaBodyCompositionInput,
  type SyncTanitaResult,
  toMeasurement,
} from "./sync-tanita-body-composition-measurements";

export type {
  SyncTanitaBodyCompositionDeps,
  SyncTanitaBodyCompositionInput,
  SyncTanitaPhase,
  SyncTanitaResult,
} from "./sync-tanita-body-composition-measurements";

export const syncTanitaBodyComposition = async (
  deps: SyncTanitaBodyCompositionDeps,
  input: SyncTanitaBodyCompositionInput
): Promise<SyncTanitaResult> => {
  const policies = await resolveExportPolicies(
    { policyRepo: deps.policyRepo },
    { profileId: input.profileId, dataType: BODY_COMPOSITION }
  );
  if (!policies.some((p) => p.enabled && p.bridgeId === GARMIN_BRIDGE_ID)) {
    return { ok: false, reason: "route-inactive" };
  }

  let csv: string;
  try {
    deps.onPhase?.("reading");
    csv = await deps.readCsv();
  } catch (err) {
    if (readNeedsReauth(err)) return { ok: false, reason: "needs-reauth" };
    return { ok: false, reason: "transport-error", error: errorMessage(err) };
  }

  deps.onPhase?.("parsing");
  const documents = deps.parse(csv);

  deps.onPhase?.("encoding");
  const measurements = documents
    .map((krd) => toMeasurement(krd, deps.encode))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  deps.onPhase?.("uploading");
  let uploaded = 0;
  let skipped = 0;
  try {
    for (const { measuredAt, payload, fit } of measurements) {
      const result = await recordExport(
        { ledgerRepo: deps.ledgerRepo },
        {
          kaiordRecordId: measurementRecordId(measuredAt),
          dataType: BODY_COMPOSITION,
          destinationBridgeId: GARMIN_BRIDGE_ID,
          payload,
          postFn: async () => {
            await deps.push(fit);
            return { externalId: GARMIN_UPLOAD_EXTERNAL_ID };
          },
        }
      );
      if (result.outcome === "created" || result.outcome === "updated") {
        uploaded += 1;
      } else {
        skipped += 1;
      }
    }
  } catch (err) {
    if (readNeedsReauth(err)) return { ok: false, reason: "needs-reauth" };
    return { ok: false, reason: "transport-error", error: errorMessage(err) };
  }

  return { ok: true, uploaded, skipped };
};
