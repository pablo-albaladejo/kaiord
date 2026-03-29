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

const buildDataLines = (krd: KRD): string[] => {
  const sessions = krd.sessions ? krd.sessions.length : 0;
  const laps = krd.laps ? krd.laps.length : 0;
  const records = krd.records ? krd.records.length : 0;
  const events = krd.events ? krd.events.length : 0;
  return [
    "",
    "--- Data ---",
    `Sessions: ${sessions}`,
    `Laps: ${laps}`,
    `Records: ${records}`,
    `Events: ${events}`,
  ];
};

const buildWorkoutLines = (workout: WorkoutInfo | null): string[] => {
  const lines = ["", "--- Workout ---"];
  if (workout) {
    lines.push(`Name: ${workout.name}`);
    lines.push(`Steps: ${workout.stepCount}`);
  } else {
    lines.push("No structured workout found.");
  }
  return lines;
};

export const buildInspectSummary = (krd: KRD): string => {
  const workout = extractWorkoutInfo(krd);
  const lines = [
    ...buildMetadataLines(krd),
    ...buildDataLines(krd),
    ...buildWorkoutLines(workout),
  ];
  return lines.join("\n");
};
