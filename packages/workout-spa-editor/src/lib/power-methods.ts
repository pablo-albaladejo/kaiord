/**
 * Power Zone Methods
 *
 * Predefined power zone calculation methods.
 */

import type { ZoneMethod } from "./zone-method-types";

const COGGAN_7: ZoneMethod = {
  id: "coggan-7",
  name: "Coggan 7-zone",
  zoneCount: 7,
  defaults: [
    { name: "Active Recovery", minPercent: 0, maxPercent: 55 },
    { name: "Endurance", minPercent: 56, maxPercent: 75 },
    { name: "Tempo", minPercent: 76, maxPercent: 90 },
    { name: "Lactate Threshold", minPercent: 91, maxPercent: 105 },
    { name: "VO2 Max", minPercent: 106, maxPercent: 120 },
    { name: "Anaerobic Capacity", minPercent: 121, maxPercent: 150 },
    { name: "Neuromuscular Power", minPercent: 151, maxPercent: 200 },
  ],
};

const FRIEL_7: ZoneMethod = {
  id: "friel-7",
  name: "Friel 7-zone",
  zoneCount: 7,
  defaults: [
    { name: "Active Recovery", minPercent: 0, maxPercent: 55 },
    { name: "Endurance", minPercent: 56, maxPercent: 74 },
    { name: "Tempo", minPercent: 75, maxPercent: 89 },
    { name: "SubThreshold", minPercent: 90, maxPercent: 104 },
    { name: "SuperThreshold", minPercent: 105, maxPercent: 120 },
    { name: "Aerobic Capacity", minPercent: 121, maxPercent: 150 },
    { name: "Neuromuscular", minPercent: 151, maxPercent: 200 },
  ],
};

const BRITISH_CYCLING_6: ZoneMethod = {
  id: "british-cycling-6",
  name: "British Cycling 6-zone",
  zoneCount: 6,
  defaults: [
    { name: "Active Recovery", minPercent: 0, maxPercent: 60 },
    { name: "Foundation", minPercent: 61, maxPercent: 80 },
    { name: "Tempo", minPercent: 81, maxPercent: 90 },
    { name: "Threshold", minPercent: 91, maxPercent: 105 },
    { name: "VO2 Max", minPercent: 106, maxPercent: 130 },
    { name: "Anaerobic", minPercent: 131, maxPercent: 200 },
  ],
};

const CUSTOM_POWER: ZoneMethod = {
  id: "custom",
  name: "Custom",
  zoneCount: 5,
  defaults: [
    { name: "Zone 1", minPercent: 0, maxPercent: 55 },
    { name: "Zone 2", minPercent: 56, maxPercent: 75 },
    { name: "Zone 3", minPercent: 76, maxPercent: 90 },
    { name: "Zone 4", minPercent: 91, maxPercent: 105 },
    { name: "Zone 5", minPercent: 106, maxPercent: 200 },
  ],
};

export const POWER_METHODS: Array<ZoneMethod> = [
  COGGAN_7,
  FRIEL_7,
  BRITISH_CYCLING_6,
  CUSTOM_POWER,
];
