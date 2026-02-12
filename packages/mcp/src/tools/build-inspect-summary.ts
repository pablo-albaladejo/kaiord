import type { KRD } from "@kaiord/core";

type WorkoutInfo = {
  readonly name: string;
  readonly stepCount: number;
};

export const buildInspectSummary = (krd: KRD): string => {
  const lines: string[] = [
    `Type: ${krd.type}`,
    `Sport: ${krd.metadata.sport}`,
    `Sub-sport: ${krd.metadata.subSport ?? "N/A"}`,
    "",
    "--- Metadata ---",
    `Created: ${krd.metadata.created}`,
    `Manufacturer: ${krd.metadata.manufacturer ?? "N/A"}`,
    `Product: ${krd.metadata.product ?? "N/A"}`,
    `Serial: ${krd.metadata.serialNumber ?? "N/A"}`,
    "",
    "--- Data ---",
    `Sessions: ${krd.sessions?.length ?? 0}`,
    `Laps: ${krd.laps?.length ?? 0}`,
    `Records: ${krd.records?.length ?? 0}`,
    `Events: ${krd.events?.length ?? 0}`,
  ];

  const workout = extractWorkoutInfo(krd);
  lines.push("");
  lines.push("--- Workout ---");
  if (workout) {
    lines.push(`Name: ${workout.name}`);
    lines.push(`Steps: ${workout.stepCount}`);
  } else {
    lines.push("No structured workout found.");
  }

  return lines.join("\n");
};

const extractWorkoutInfo = (krd: KRD): WorkoutInfo | null => {
  const ext = krd.extensions?.structured_workout;
  if (!ext || typeof ext !== "object" || Array.isArray(ext)) return null;
  const w = ext as Record<string, unknown>;
  const steps = Array.isArray(w.steps) ? w.steps : [];
  return { name: String(w.name ?? "Unnamed"), stepCount: steps.length };
};
