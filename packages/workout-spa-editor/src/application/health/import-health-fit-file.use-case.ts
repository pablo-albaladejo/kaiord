/**
 * importHealthFitFile — application use case
 *
 * Takes a KRD already parsed from a FIT file plus a `PersistencePort`
 * and a `profileId`, and writes a new health record into the
 * corresponding store. Dispatches on `krd.type`.
 *
 * Throws `UnsupportedHealthKrdError` when the KRD type is not a
 * health-domain type (caller should surface a clear toast). Throws
 * `MissingHealthPayloadError` when the KRD claims a health type but
 * carries no `extensions.health.<metric>` payload — that's a malformed
 * file the upstream parser should not have produced.
 */

import type { HealthFileType, KRD } from "@kaiord/core";
import { isHealthFileType } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import {
  type HealthExtensions,
  persistHealthByType,
} from "./import-health-dispatch";
import { UnsupportedHealthKrdError } from "./import-health-errors";

export {
  MissingHealthPayloadError,
  UnsupportedHealthKrdError,
} from "./import-health-errors";

export type ImportHealthFitFileDeps = {
  persistence: PersistencePort;
  profileId: string;
  newId?: () => string;
};

export type ImportHealthFitFileResult = {
  type: HealthFileType;
  recordId: string;
};

const readHealth = (krd: KRD): HealthExtensions => {
  const extensions = krd.extensions as
    | { health?: HealthExtensions }
    | undefined;
  return extensions?.health ?? {};
};

export const importHealthFitFile = async (
  deps: ImportHealthFitFileDeps,
  krd: KRD
): Promise<ImportHealthFitFileResult> => {
  if (!isHealthFileType(krd.type)) {
    throw new UnsupportedHealthKrdError(krd.type);
  }
  const recordId = deps.newId?.() ?? crypto.randomUUID();
  await persistHealthByType(deps.persistence, krd.type, readHealth(krd), {
    id: recordId,
    profileId: deps.profileId,
  });
  return { type: krd.type, recordId };
};
