import type { KRD, Logger, Workout } from "@kaiord/core";
import { createGarminParsingError } from "@kaiord/core";

import { GARMIN_NAME_MAX } from "../constants";
import { mapGarminSportToKrd } from "../mappers/sport.mapper";
import { garminWorkoutParseSchema } from "../schemas/garmin-workout-parse.schema";
import { flattenSegmentsToSteps } from "./flatten-segments.converter";
import { addPoolLength } from "./pool-length.mapper";

export const convertGarminToKRD = (gcnString: string, logger: Logger): KRD => {
  logger.info("Parsing Garmin Connect JSON");

  let parsed: unknown;
  try {
    parsed = JSON.parse(gcnString);
  } catch (error) {
    throw createGarminParsingError("Invalid JSON in GCN file", error);
  }

  const result = garminWorkoutParseSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw createGarminParsingError(`Invalid GCN data: ${issues}`);
  }

  const gcn = result.data;
  const sport = mapGarminSportToKrd(gcn.sportType?.sportTypeKey ?? "");
  const segments = gcn.workoutSegments ?? [];
  const steps = flattenSegmentsToSteps(segments, logger);

  const workout: Workout = {
    name: truncateName(gcn.workoutName ?? "", logger),
    sport,
    steps,
  };

  addPoolLength(gcn, workout);

  const now = new Date().toISOString();
  const extensions: Record<string, unknown> = { structured_workout: workout };
  if (typeof gcn.isSessionTransitionEnabled === "boolean") {
    extensions.gcn = {
      isSessionTransitionEnabled: gcn.isSessionTransitionEnabled,
    };
  }

  return {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: now, sport, manufacturer: "garmin-connect" },
    extensions,
  };
};

const truncateName = (name: string, logger: Logger): string => {
  if (name.length <= GARMIN_NAME_MAX) return name;
  logger.warn(
    `Lossy conversion: workout name truncated to ${GARMIN_NAME_MAX} characters`,
    { originalLength: name.length }
  );
  return name.substring(0, GARMIN_NAME_MAX);
};
