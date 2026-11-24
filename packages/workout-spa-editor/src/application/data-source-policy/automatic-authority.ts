/**
 * The Authority the Kaiord App picks by itself for a kind of data more than
 * one source reports, so nobody has to be asked (GLOSSARY.md "Authority").
 *
 * One rule, the same shape for every kind: what the athlete entered or
 * imported themselves decides its day; past that, the Platforms in a fixed
 * order per kind, best measurement first. A Platform whose import is switched
 * off (a Disconnect) drops to the end, and a source the order does not name
 * comes last, so a value already stored is never hidden by the rule: every
 * record stays, the rule only picks which one is read.
 *
 * A kind with no entry has no Authority: every source's records are kept and
 * shown side by side (Activities, planned sessions, Workouts).
 */
import type { ManagedDataType } from "@kaiord/core";

import type { CapabilityId } from "../../lib/capabilities/capability-catalogue";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { MANUAL_SOURCE_BRIDGE_ID } from "../import/stamp-provenance";

/** The Capability whose choices, while it is on, override this rule. */
export const AUTHORITY_MATRIX_ID: CapabilityId = "authority-matrix";

const FIT_IMPORT = "fit-import";

/** What the athlete brought in by hand, ahead of every Platform. */
export const OWN_ENTRY_SOURCES: readonly string[] = [
  MANUAL_SOURCE_BRIDGE_ID,
  FIT_IMPORT,
];

/* A scale measures weight and body composition; TrainingPeaks and Train2Go
   relay a number someone typed into them. Sleep, HRV, stress and the rest are
   measured by what is worn overnight: WHOOP is worn all day and night. */
const SCALE_FIRST = [
  "tanita-bridge",
  "trainingpeaks-bridge",
  "train2go-bridge",
];
const WORN_FIRST = ["whoop-bridge", "garmin-bridge"];

export const AUTOMATIC_AUTHORITY: Partial<
  Record<ManagedDataType, readonly string[]>
> = {
  weight: SCALE_FIRST,
  "body-composition": SCALE_FIRST,
  sleep: WORN_FIRST,
  hrv: WORN_FIRST,
  "daily-wellness": WORN_FIRST,
  stress: WORN_FIRST,
  strain: WORN_FIRST,
  vitals: WORN_FIRST,
  "heart-rate-series": WORN_FIRST,
  "training-zones": ["train2go-bridge"],
};

export const hasAutomaticAuthority = (dataType: ManagedDataType): boolean =>
  AUTOMATIC_AUTHORITY[dataType] !== undefined;

/** The bridges whose import route is switched off. */
export const disabledImports = (
  importPolicies: readonly IntegrationPolicy[]
): ReadonlySet<string> =>
  new Set(importPolicies.filter((p) => !p.enabled).map((p) => p.bridgeId));

/** The order the rule reads a kind in, given its import routes. */
export const automaticOrder = (
  dataType: ManagedDataType,
  importPolicies: readonly IntegrationPolicy[]
): string[] => {
  const off = disabledImports(importPolicies);
  const platforms = AUTOMATIC_AUTHORITY[dataType] ?? [];
  return [
    ...OWN_ENTRY_SOURCES,
    ...platforms.filter((id) => !off.has(id)),
    ...platforms.filter((id) => off.has(id)),
  ];
};

/** The Platform the rule picks among a kind's sources, own entries aside;
    `undefined` for a kind with no Authority or no Platform. */
export const automaticHead = (
  dataType: ManagedDataType,
  sources: readonly string[]
): string | undefined => {
  const ranked = AUTOMATIC_AUTHORITY[dataType];
  if (ranked === undefined) return undefined;
  const platforms = sources.filter((id) => !OWN_ENTRY_SOURCES.includes(id));
  return ranked.find((id) => platforms.includes(id)) ?? platforms[0];
};
