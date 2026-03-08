import type { ZoneMethod } from "./zone-method-types";

type D = { name: string; minPercent: number; maxPercent: number };
const d = (name: string, min: number, max: number): D => ({
  name,
  minPercent: min,
  maxPercent: max,
});

export const COGGAN_7: ZoneMethod = {
  id: "coggan-7",
  name: "Coggan 7-zone",
  zoneCount: 7,
  defaults: [
    d("Active Recovery", 0, 55),
    d("Endurance", 56, 75),
    d("Tempo", 76, 90),
    d("Lactate Threshold", 91, 105),
    d("VO2 Max", 106, 120),
    d("Anaerobic Capacity", 121, 150),
    d("Neuromuscular Power", 151, 200),
  ],
};

export const FRIEL_7: ZoneMethod = {
  id: "friel-7",
  name: "Friel 7-zone",
  zoneCount: 7,
  defaults: [
    d("Active Recovery", 0, 55),
    d("Endurance", 56, 74),
    d("Tempo", 75, 89),
    d("SubThreshold", 90, 104),
    d("SuperThreshold", 105, 120),
    d("Aerobic Capacity", 121, 150),
    d("Neuromuscular", 151, 200),
  ],
};
