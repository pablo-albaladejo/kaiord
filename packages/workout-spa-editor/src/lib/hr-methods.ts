/**
 * Heart Rate Zone Methods
 *
 * Predefined heart rate zone calculation methods.
 */

import type { ZoneMethod } from "./zone-method-types";

const KARVONEN_5: ZoneMethod = {
  id: "karvonen-5",
  name: "Karvonen 5-zone",
  zoneCount: 5,
  defaults: [
    { name: "Recovery", minPercent: 0, maxPercent: 82 },
    { name: "Aerobic", minPercent: 82, maxPercent: 89 },
    { name: "Tempo", minPercent: 89, maxPercent: 94 },
    { name: "Threshold", minPercent: 94, maxPercent: 100 },
    { name: "VO2 Max", minPercent: 100, maxPercent: 106 },
  ],
};

const FRIEL_HR_5: ZoneMethod = {
  id: "friel-hr-5",
  name: "Friel 5-zone",
  zoneCount: 5,
  defaults: [
    { name: "Recovery", minPercent: 0, maxPercent: 81 },
    { name: "Extensive Endurance", minPercent: 81, maxPercent: 89 },
    { name: "Intensive Endurance", minPercent: 90, maxPercent: 93 },
    { name: "Threshold", minPercent: 94, maxPercent: 99 },
    { name: "Aerobic Capacity", minPercent: 100, maxPercent: 106 },
  ],
};

const POLARIZED_HR_3: ZoneMethod = {
  id: "polarized-hr-3",
  name: "Polarized 3-zone",
  zoneCount: 3,
  defaults: [
    { name: "Low Intensity", minPercent: 0, maxPercent: 80 },
    { name: "Threshold", minPercent: 80, maxPercent: 100 },
    { name: "High Intensity", minPercent: 100, maxPercent: 106 },
  ],
};

const CUSTOM_HR: ZoneMethod = {
  id: "custom",
  name: "Custom",
  zoneCount: 5,
  defaults: [
    { name: "Zone 1", minPercent: 0, maxPercent: 82 },
    { name: "Zone 2", minPercent: 82, maxPercent: 89 },
    { name: "Zone 3", minPercent: 89, maxPercent: 94 },
    { name: "Zone 4", minPercent: 94, maxPercent: 100 },
    { name: "Zone 5", minPercent: 100, maxPercent: 106 },
  ],
};

export const HR_METHODS: Array<ZoneMethod> = [
  POLARIZED_HR_3,
  KARVONEN_5,
  FRIEL_HR_5,
  CUSTOM_HR,
];
