import type { KRD } from "@kaiord/core";

type WorkoutInfo = {
  readonly name: string;
  readonly stepCount: number;
};

const orNA = (value: string | undefined): string => value ?? "N/A";

const extractWorkoutInfo = (krd: KRD): WorkoutInfo | null => {
  const ext = krd.extensions?.structured_workout;
  if (!ext || typeof ext !== "object" || Array.isArray(ext)) return null;
  const w = ext as Record<string, unknown>;
  const steps = Array.isArray(w.steps) ? w.steps : [];
  return { name: String(w.name ?? "Unnamed"), stepCount: steps.length };
};

const buildMetadataLines = (krd: KRD): string[] => [
  `Type: ${krd.type}`,
  `Sport: ${krd.metadata.sport}`,
  `Sub-sport: ${orNA(krd.metadata.subSport)}`,
  "",
  "--- Metadata ---",
  `Created: ${krd.metadata.created}`,
  `Manufacturer: ${orNA(krd.metadata.manufacturer)}`,
  `Product: ${orNA(krd.metadata.product)}`,
  `Serial: ${orNA(krd.metadata.serialNumber)}`,
];

const buildDataLines = (krd: KRD): string[] => [
  "",
  "--- Data ---",
  `Sessions: ${krd.sessions?.length ?? 0}`,
  `Laps: ${krd.laps?.length ?? 0}`,
  `Records: ${krd.records?.length ?? 0}`,
  `Events: ${krd.events?.length ?? 0}`,
];

const buildWorkoutLines = (workout: WorkoutInfo | null): string[] => {
  if (!workout) return ["", "--- Workout ---", "No structured workout found."];
  return [
    "",
    "--- Workout ---",
    `Name: ${workout.name}`,
    `Steps: ${workout.stepCount}`,
  ];
};

export const buildInspectSummary = (krd: KRD): string => {
  const workout = extractWorkoutInfo(krd);
  return [
    ...buildMetadataLines(krd),
    ...buildDataLines(krd),
    ...buildWorkoutLines(workout),
  ].join("\n");
};
