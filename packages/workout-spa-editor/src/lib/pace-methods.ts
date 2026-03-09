/**
 * Pace Zone Methods
 *
 * Predefined pace zone calculation methods.
 * Note: for pace, higher % = slower (min is fast, max is slow).
 */

import type { ZoneMethod } from "./zone-method-types";

const DANIELS_5: ZoneMethod = {
  id: "daniels-5",
  name: "Daniels 5-zone",
  zoneCount: 5,
  defaults: [
    { name: "Easy", minPercent: 115, maxPercent: 200 },
    { name: "Aerobic", minPercent: 108, maxPercent: 115 },
    { name: "Tempo", minPercent: 100, maxPercent: 108 },
    { name: "Threshold", minPercent: 93, maxPercent: 100 },
    { name: "VO2 Max", minPercent: 0, maxPercent: 93 },
  ],
};

const CUSTOM_PACE: ZoneMethod = {
  id: "custom",
  name: "Custom",
  zoneCount: 5,
  defaults: [
    { name: "Zone 1", minPercent: 115, maxPercent: 200 },
    { name: "Zone 2", minPercent: 108, maxPercent: 115 },
    { name: "Zone 3", minPercent: 100, maxPercent: 108 },
    { name: "Zone 4", minPercent: 93, maxPercent: 100 },
    { name: "Zone 5", minPercent: 0, maxPercent: 93 },
  ],
};

export const PACE_METHODS: Array<ZoneMethod> = [DANIELS_5, CUSTOM_PACE];
