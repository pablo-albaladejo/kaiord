import { isDatedSnapshotOf } from "../cassettes/dated-snapshot";
import {
  OFFICIAL_CASSETTE_MODEL,
  OFFICIAL_SERVED_FORM,
  isOfficialServedModel,
} from "../cassettes/validate-cassette";
import type { ServedForm } from "../cassettes/validate-cassette";

export type ServedModel =
  { ok: true; servedModelId: string } | { ok: false; reason: string };

/**
 * The model the CLI says it served: exactly one `modelUsage` key, equal to
 * the requested id or a dated snapshot of it. Anything else is rejected
 * before a cassette exists.
 */
export const servedModelOf = (
  servedModels: ReadonlyArray<string>,
  requested: string
): ServedModel => {
  if (servedModels.length !== 1) {
    return {
      ok: false,
      reason: `modelUsage names ${servedModels.length} served models, not exactly one`,
    };
  }
  const [served = ""] = servedModels;
  return served === requested || isDatedSnapshotOf(served, requested)
    ? { ok: true, servedModelId: served }
    : {
        ok: false,
        reason: `served ${served}, which is neither ${requested} nor a dated snapshot of it`,
      };
};

/**
 * Why a committed write is refused, or `undefined`. Fails closed while the
 * served form is unpinned: the repository never holds a cassette whose served
 * id was accepted on a guess.
 */
export const committedServedFault = (
  servedModelId: string,
  form: ServedForm | null = OFFICIAL_SERVED_FORM
): string | undefined => {
  if (form === null) {
    return "OFFICIAL_SERVED_FORM is not pinned: pin it in cassettes/validate-cassette.ts from a calibration capture before recording a committed cassette";
  }
  return isOfficialServedModel(servedModelId, form)
    ? undefined
    : `served ${servedModelId}, but the pinned form for ${OFFICIAL_CASSETTE_MODEL} is ${form}`;
};

/**
 * Checked before a `--record` pass makes any call: recording the official
 * model while its served form is unpinned would spend every call on a
 * cassette the writer then refuses.
 */
export const recordPreflightFault = (
  modelId: string,
  form: ServedForm | null = OFFICIAL_SERVED_FORM
): string | undefined =>
  modelId === OFFICIAL_CASSETTE_MODEL && form === null
    ? committedServedFault(modelId, form)
    : undefined;
