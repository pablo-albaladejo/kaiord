import { BIOCHEMISTRY } from "./catalog/biochemistry";
import { HEMOGRAM_DIFFERENTIAL } from "./catalog/hemogram-differential";
import { HEMOGRAM_RED } from "./catalog/hemogram-red";
import { HEMOGRAM_WHITE } from "./catalog/hemogram-white";
import { HEPATIC } from "./catalog/hepatic";
import { HORMONES_SPORTS } from "./catalog/hormones-sports";
import { IONS } from "./catalog/ions";
import { IRON } from "./catalog/iron";
import { LIPIDS } from "./catalog/lipids";
import { THYROID_VITAMINS } from "./catalog/thyroid-vitamins";
import type { LabParameter } from "./lab-parameter";

/**
 * Immutable reference catalog of the core lab parameters. Ranges and factors
 * are orientative fallbacks — the user's report range is the authority. The
 * long tail is modelled with free `custom:<slug>` parameters (no conversion,
 * no fallback range) rather than extending this list.
 */
export const LAB_PARAMETER_CATALOG: readonly LabParameter[] = [
  ...HEMOGRAM_RED,
  ...HEMOGRAM_WHITE,
  ...HEMOGRAM_DIFFERENTIAL,
  ...BIOCHEMISTRY,
  ...LIPIDS,
  ...HEPATIC,
  ...IONS,
  ...IRON,
  ...THYROID_VITAMINS,
  ...HORMONES_SPORTS,
];

const BY_KEY: ReadonlyMap<string, LabParameter> = new Map(
  LAB_PARAMETER_CATALOG.map((parameter) => [parameter.key, parameter])
);

/** Look up a core parameter by its canonical key. */
export function getLabParameter(key: string): LabParameter | undefined {
  return BY_KEY.get(key);
}

export const CUSTOM_PARAMETER_PREFIX = "custom:";

/** Build a free-parameter key for the long tail (`custom:<slug>`). */
export function customParameterKey(slug: string): string {
  return `${CUSTOM_PARAMETER_PREFIX}${slug}`;
}

/** Whether a parameter key denotes a free (custom) parameter. */
export function isCustomParameterKey(key: string): boolean {
  return key.startsWith(CUSTOM_PARAMETER_PREFIX);
}
