import type { ZoneMethod } from "./zone-method-types";

const z = (name: string, min: number, max: number) => ({
  name, minPercent: min, maxPercent: max,
});

const POLARIZED_3: ZoneMethod = {
  id: "polarized-3", name: "Polarized 3-zone", zoneCount: 3,
  defaults: [z("Low Intensity", 0, 80), z("Threshold", 81, 105), z("High Intensity", 106, 200)],
};

const CLASSIC_5: ZoneMethod = {
  id: "classic-5", name: "Classic 5-zone", zoneCount: 5,
  defaults: [
    z("Recovery", 0, 55), z("Endurance", 56, 75), z("Tempo", 76, 90),
    z("Threshold", 91, 105), z("VO2 Max", 106, 200),
  ],
};

const BRITISH_CYCLING_6: ZoneMethod = {
  id: "british-cycling-6", name: "British Cycling 6-zone", zoneCount: 6,
  defaults: [
    z("Active Recovery", 0, 60), z("Foundation", 61, 80), z("Tempo", 81, 90),
    z("Threshold", 91, 105), z("VO2 Max", 106, 130), z("Anaerobic", 131, 200),
  ],
};

const COGGAN_7: ZoneMethod = {
  id: "coggan-7", name: "Coggan 7-zone", zoneCount: 7,
  defaults: [
    z("Active Recovery", 0, 55), z("Endurance", 56, 75), z("Tempo", 76, 90),
    z("Lactate Threshold", 91, 105), z("VO2 Max", 106, 120),
    z("Anaerobic Capacity", 121, 150), z("Neuromuscular Power", 151, 200),
  ],
};

const FRIEL_7: ZoneMethod = {
  id: "friel-7", name: "Friel 7-zone", zoneCount: 7,
  defaults: [
    z("Active Recovery", 0, 55), z("Endurance", 56, 74), z("Tempo", 75, 89),
    z("SubThreshold", 90, 104), z("SuperThreshold", 105, 120),
    z("Aerobic Capacity", 121, 150), z("Neuromuscular", 151, 200),
  ],
};

const CUSTOM_POWER: ZoneMethod = {
  id: "custom", name: "Custom", zoneCount: 5,
  defaults: [
    z("Zone 1", 0, 55), z("Zone 2", 56, 75), z("Zone 3", 76, 90),
    z("Zone 4", 91, 105), z("Zone 5", 106, 200),
  ],
};

export const POWER_METHODS: Array<ZoneMethod> = [
  POLARIZED_3, CLASSIC_5, BRITISH_CYCLING_6, COGGAN_7, FRIEL_7, CUSTOM_POWER,
];
