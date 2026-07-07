/**
 * importHealthFitFile — application use case
 *
 * Takes a KRD already parsed from a FIT file plus a `PersistencePort`
 * and a `profileId`, and upserts a health record via
 * `upsertImportedRecord` (natural-key insert-or-ignore on
 * [profileId+sourceBridgeId+externalId]) — re-importing the same FIT
 * reading is a no-op, not a duplicate (AC-7).
 *
 * `sourceBridgeId` is always "fit-import"; `externalId` is a
 * content-hash of the metric payload + measuredAt (`deriveExternalId`),
 * stamped via the shared `stampProvenance` constructor also used by the
 * manual entry path, so both paths write the identical provenance shape.
 *
 * Throws `UnsupportedHealthKrdError` when the KRD type is not a
 * health-domain type (caller should surface a clear toast). Throws
 * `MissingHealthPayloadError` when the KRD claims a health type but
 * carries no `extensions.health.<metric>` payload — that's a malformed
 * file the upstream parser should not have produced.
 */

import type { HealthFileType, KRD } from "@kaiord/core";
import { deriveExternalId, isHealthFileType } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import { stampProvenance } from "../import/stamp-provenance";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";
import {
  extractHealthMetric,
  type HealthExtensions,
} from "./import-health-dispatch";
import {
  MissingHealthPayloadError,
  UnsupportedHealthKrdError,
} from "./import-health-errors";

export { MissingHealthPayloadError, UnsupportedHealthKrdError };

const FIT_IMPORT_SOURCE_BRIDGE_ID = "fit-import";

export type ImportHealthFitFileDeps = {
  persistence: PersistencePort;
  profileId: string;
};

export type ImportHealthFitFileResult = {
  type: HealthFileType;
  recordId: string;
};

const readHealth = (krd: KRD): HealthExtensions => {
  const extensions = krd.extensions as
    { health?: HealthExtensions } | undefined;
  return extensions?.health ?? {};
};

export const importHealthFitFile = async (
  deps: ImportHealthFitFileDeps,
  krd: KRD
): Promise<ImportHealthFitFileResult> => {
  if (!isHealthFileType(krd.type)) {
    throw new UnsupportedHealthKrdError(krd.type);
  }
  const extracted = extractHealthMetric(krd.type, readHealth(krd));
  if (!extracted) throw new MissingHealthPayloadError(krd.type);

  const { dataType, payload, date, measuredAt } = extracted;
  const provenance = stampProvenance(
    FIT_IMPORT_SOURCE_BRIDGE_ID,
    deriveExternalId({ payload, measuredAt })
  );

  const { kaiordRecordId } = await upsertImportedRecord(
    { recordRepo: deps.persistence.importedRecords },
    {
      profileId: deps.profileId,
      dataType,
      date,
      payload,
      measuredAt,
      ...provenance,
    }
  );
  return { type: krd.type, recordId: kaiordRecordId };
};
