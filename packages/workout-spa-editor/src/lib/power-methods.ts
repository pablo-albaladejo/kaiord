import { COGGAN_7, FRIEL_7 } from "./power-methods-advanced";
import type { ZoneMethod } from "./zone-method-types";

type D = { name: string; minPercent: number; maxPercent: number };
const d = (name: string, min: number, max: number): D => ({
  name,
  minPercent: min,
  maxPercent: max,
});

const POLARIZED_3: ZoneMethod = {
  id: "polarized-3",
  name: "Polarized 3-zone",
  zoneCount: 3,
  defaults: [
    d("Low Intensity", 0, 80),
    d("Threshold", 81, 105),
    d("High Intensity", 106, 200),
  ],
};

const CLASSIC_5: ZoneMethod = {
  id: "classic-5",
  name: "Classic 5-zone",
  zoneCount: 5,
  defaults: [
    d("Recovery", 0, 55),
    d("Endurance", 56, 75),
    d("Tempo", 76, 90),
    d("Threshold", 91, 105),
    d("VO2 Max", 106, 200),
  ],
};

const BRITISH_CYCLING_6: ZoneMethod = {
  id: "british-cycling-6",
  name: "British Cycling 6-zone",
  zoneCount: 6,
  defaults: [
    d("Active Recovery", 0, 60),
    d("Foundation", 61, 80),
    d("Tempo", 81, 90),
    d("Threshold", 91, 105),
    d("VO2 Max", 106, 130),
    d("Anaerobic", 131, 200),
  ],
};

const CUSTOM: ZoneMethod = {
  id: "custom",
  name: "Custom",
  zoneCount: 5,
  defaults: [
    d("Zone 1", 0, 55),
    d("Zone 2", 56, 75),
    d("Zone 3", 76, 90),
    d("Zone 4", 91, 105),
    d("Zone 5", 106, 200),
  ],
};

export const POWER_METHODS: Array<ZoneMethod> = [
  POLARIZED_3,
  CLASSIC_5,
  BRITISH_CYCLING_6,
  COGGAN_7,
  FRIEL_7,
  CUSTOM,
];
