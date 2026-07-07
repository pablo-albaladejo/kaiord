/**
 * resolveCatalogRefRange — the catalog's sex-aware fallback reference range
 * for one parameter. Shared by the entry form's ref-field prefill and by
 * `resolveEffectiveRefRange`'s storage resolution, so the number shown to
 * the user always matches the number actually persisted.
 */
import type { BiologicalSex, LabParameter } from "@kaiord/core";

export type RefRange = { low?: number; high?: number };

export function resolveCatalogRefRange(
  param: LabParameter,
  sex: BiologicalSex | undefined
): RefRange | undefined {
  if (sex && param.refBySex) return param.refBySex[sex];
  if (param.canonicalRefLow == null && param.canonicalRefHigh == null) {
    return undefined;
  }
  return { low: param.canonicalRefLow, high: param.canonicalRefHigh };
}
