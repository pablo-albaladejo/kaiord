/**
 * Zone Methods Registry
 *
 * Central registry for all zone calculation methods.
 */

export { HR_METHODS } from "./hr-methods";
export { PACE_METHODS } from "./pace-methods";
export { POWER_METHODS } from "./power-methods";
export type { ZoneMethod, ZoneMethodDefault } from "./zone-method-types";

import { HR_METHODS } from "./hr-methods";
import { PACE_METHODS } from "./pace-methods";
import { POWER_METHODS } from "./power-methods";
import type { ZoneMethod } from "./zone-method-types";

export function findMethod(
  methods: Array<ZoneMethod>,
  id: string
): ZoneMethod | undefined {
  return methods.find((m) => m.id === id);
}

export function getDefaultMethodId(type: "power" | "hr" | "pace"): string {
  const map = { power: "coggan-7", hr: "karvonen-5", pace: "daniels-5" };
  return map[type];
}

export function getMethodsForType(
  type: "power" | "hr" | "pace"
): Array<ZoneMethod> {
  const map = { power: POWER_METHODS, hr: HR_METHODS, pace: PACE_METHODS };
  return map[type];
}
