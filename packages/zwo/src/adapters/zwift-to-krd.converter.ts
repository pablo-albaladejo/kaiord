import type { KRD } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import {
  extractIntervals,
  extractTags,
} from "./zwift-to-krd/intervals-extractor";
import { processIntervals } from "./zwift-to-krd/intervals-processor";
import {
  extractFitExtensions,
  extractMetadata,
} from "./zwift-to-krd/metadata-extractor";

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
  // Kaiord round-trip attributes
  "@_kaiord:timeCreated"?: string;
  "@_kaiord:manufacturer"?: string;
  "@_kaiord:product"?: string;
  "@_kaiord:serialNumber"?: string;
  "@_kaiord:fitType"?: string;
  "@_kaiord:hrmFitProductId"?: number;
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

  const durationType: "time" | "distance" =
    workoutFile.durationType === "distance" ? "distance" : "time";

  const intervals = extractIntervals(workoutFile.workout);
  const steps = processIntervals(intervals, durationType);

  const metadata = extractMetadata(workoutFile, sport);
  const fitExtensions = extractFitExtensions(workoutFile);

  const extensions: Record<string, unknown> = {
    structured_workout: {
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
  };

  if (fitExtensions) {
    extensions.fit = fitExtensions;
  }

  return {
    version: "1.0",
    type: "structured_workout",
    metadata,
    extensions,
  };
};
