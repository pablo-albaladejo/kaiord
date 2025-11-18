import type { KRD } from "../../domain/schemas/krd";
import type { Logger } from "../../ports/logger";
import {
  extractIntervals,
  extractTags,
} from "./zwift-to-krd/intervals-extractor";
import { processIntervals } from "./zwift-to-krd/intervals-processor";

type ZwiftWorkoutFile = {
  author?: string;
  name?: string;
  description?: string;
  sportType?: string;
  durationType?: string;
  thresholdSecPerKm?: number;
  tags?: { tag?: Array<{ "@_name": string }> | { "@_name": string } };
  workout?: {
    SteadyState?: unknown;
    Warmup?: unknown;
    Ramp?: unknown;
    Cooldown?: unknown;
    IntervalsT?: unknown;
    FreeRide?: unknown;
  };
};

export const convertZwiftToKRD = (zwiftData: unknown, logger: Logger): KRD => {
  logger.debug("Converting Zwift to KRD");

  const workoutFile = (zwiftData as { workout_file: unknown })
    .workout_file as ZwiftWorkoutFile;

  const sport =
    workoutFile.sportType === "bike"
      ? "cycling"
      : workoutFile.sportType === "run"
        ? "running"
        : "generic";

  const durationType = workoutFile.durationType || "time";

  const intervals = extractIntervals(workoutFile.workout);
  const steps = processIntervals(intervals, durationType);

  return {
    version: "1.0",
    type: "workout",
    metadata: {
      created: new Date().toISOString(),
      sport,
    },
    extensions: {
      workout: {
        name: workoutFile.name,
        sport,
        steps,
      },
      zwift: {
        author: workoutFile.author,
        description: workoutFile.description,
        durationType,
        thresholdSecPerKm: workoutFile.thresholdSecPerKm,
        tags: extractTags(workoutFile.tags),
      },
    },
  };
};
