/**
 * Zone-table classifier types and constants.
 */
import { HR_METHODS } from "../../lib/hr-methods";
import { PACE_METHODS } from "../../lib/pace-methods";
import { POWER_METHODS } from "../../lib/power-methods";

export type ZoneTableState =
  | "empty"
  | "default-template"
  | "method-derived"
  | "train2go-synced-clean"
  | "train2go-synced-edited"
  | "user-customized";

export type Sport = "cycling" | "running" | "swimming";
export type ZoneKind = "heartRateZones" | "powerZones" | "paceZones";

/**
 * The set of method ids accepted as `method-derived` (per D-MA1
 * "Method registry — source of truth"). Computed once from the
 * lib/zone-methods registry. Tests use this set, never a hardcoded list.
 */
export const ALL_FORMULA_IDS = new Set<string>([
  ...HR_METHODS.map((m) => m.id),
  ...POWER_METHODS.map((m) => m.id),
  ...PACE_METHODS.map((m) => m.id),
]);
