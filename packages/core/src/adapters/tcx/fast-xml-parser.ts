import { XMLParser } from "fast-xml-parser";
import type { KRD } from "../../domain/schemas/krd";
import type { Workout, WorkoutStep } from "../../domain/schemas/workout";
import { createTcxParsingError } from "../../domain/types/errors";
import type { Logger } from "../../ports/logger";
import type { TcxReader } from "../../ports/tcx-reader";
import { TCX_TO_KRD_SPORT, tcxSportSchema } from "./schemas/tcx-sport";

export const createFastXmlTcxReader =
  (logger: Logger): TcxReader =>
  async (xmlString: string): Promise<KRD> => {
    logger.debug("Parsing TCX file", { xmlLength: xmlString.length });

    let tcxData: unknown;
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });

      tcxData = parser.parse(xmlString);
    } catch (error) {
      logger.error("Failed to parse TCX XML", { error });
      throw createTcxParsingError("Failed to parse TCX file", error);
    }

    if (
      !tcxData ||
      typeof tcxData !== "object" ||
      !("TrainingCenterDatabase" in tcxData)
    ) {
      const error = createTcxParsingError(
        "Invalid TCX format: missing TrainingCenterDatabase element"
      );
      logger.error("Invalid TCX structure", { error });
      throw error;
    }

    logger.info("TCX file parsed successfully");

    return convertTcxToKRD(tcxData, logger);
  };

const convertTcxToKRD = (
  tcxData: Record<string, unknown>,
  logger: Logger
): KRD => {
  logger.debug("Converting TCX to KRD");

  const trainingCenterDatabase = tcxData.TrainingCenterDatabase as Record<
    string,
    unknown
  >;
  const workouts = trainingCenterDatabase.Workouts as
    | Record<string, unknown>
    | undefined;

  if (!workouts) {
    throw createTcxParsingError("No workouts found in TCX file");
  }

  // TCX can have single workout or array of workouts
  const workoutArray = Array.isArray(workouts.Workout)
    ? workouts.Workout
    : [workouts.Workout];

  if (workoutArray.length === 0) {
    throw createTcxParsingError("No workout data found in TCX file");
  }

  // Convert first workout (TCX files typically contain one workout)
  const tcxWorkout = workoutArray[0] as Record<string, unknown>;
  const workout = convertTcxWorkout(tcxWorkout, logger);

  // Build KRD structure
  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: new Date().toISOString(),
      sport: workout.sport,
      subSport: workout.subSport,
    },
    extensions: {
      workout,
    },
  };

  logger.debug("TCX to KRD conversion complete");
  return krd;
};

const convertTcxWorkout = (
  tcxWorkout: Record<string, unknown>,
  logger: Logger
): Workout => {
  logger.debug("Converting TCX workout");

  // Extract sport
  const sportAttr = tcxWorkout["@_Sport"] as string | undefined;
  const sportResult = tcxSportSchema.safeParse(sportAttr);
  const sport = sportResult.success
    ? TCX_TO_KRD_SPORT[sportResult.data]
    : "generic";

  // Extract workout name
  const name = tcxWorkout.Name as string | undefined;

  // Extract steps
  const steps: Array<WorkoutStep> = [];
  const tcxSteps = tcxWorkout.Step;

  if (tcxSteps) {
    const stepArray = Array.isArray(tcxSteps) ? tcxSteps : [tcxSteps];
    let stepIndex = 0;

    for (const tcxStep of stepArray) {
      const step = convertTcxStep(
        tcxStep as Record<string, unknown>,
        stepIndex,
        logger
      );
      if (step) {
        steps.push(step);
        stepIndex++;
      }
    }
  }

  return {
    name,
    sport,
    steps,
  };
};

const convertTcxStep = (
  tcxStep: Record<string, unknown>,
  stepIndex: number,
  logger: Logger
): WorkoutStep | null => {
  logger.debug("Converting TCX step", { stepIndex });

  // Check if this is a Repeat block
  const stepType = tcxStep["@_xsi:type"] as string | undefined;
  if (stepType === "Repeat_t") {
    // Handle repetition blocks in a future task
    logger.warn("Repetition blocks not yet supported", { stepIndex });
    return null;
  }

  // Extract step name
  const name = tcxStep.Name as string | undefined;

  // Extract duration
  const duration = convertTcxDuration(
    tcxStep.Duration as Record<string, unknown> | undefined,
    logger
  );
  if (!duration) {
    logger.warn("Step has no valid duration, skipping", { stepIndex });
    return null;
  }

  // Extract target
  const target = convertTcxTarget(
    tcxStep.Target as Record<string, unknown> | undefined,
    logger
  );
  if (!target) {
    logger.warn("Step has no valid target, skipping", { stepIndex });
    return null;
  }

  // Extract intensity
  const intensityValue = tcxStep.Intensity as string | undefined;
  const intensity = intensityValue?.toLowerCase() as
    | "warmup"
    | "active"
    | "cooldown"
    | "rest"
    | undefined;

  return {
    stepIndex,
    name,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity,
  };
};

const convertTcxDuration = (
  tcxDuration: Record<string, unknown> | undefined,
  logger: Logger
):
  | { type: "time"; seconds: number }
  | { type: "distance"; meters: number }
  | { type: "open" }
  | null => {
  if (!tcxDuration) {
    return null;
  }

  const durationType = tcxDuration["@_xsi:type"] as string | undefined;

  if (durationType === "Time_t") {
    const seconds = tcxDuration.Seconds as number | undefined;
    if (typeof seconds === "number" && seconds > 0) {
      return { type: "time", seconds };
    }
  }

  if (durationType === "Distance_t") {
    const meters = tcxDuration.Meters as number | undefined;
    if (typeof meters === "number" && meters > 0) {
      return { type: "distance", meters };
    }
  }

  if (durationType === "LapButton_t") {
    return { type: "open" };
  }

  logger.warn("Unsupported duration type", { durationType });
  return null;
};

const convertTcxTarget = (
  tcxTarget: Record<string, unknown> | undefined,
  logger: Logger
):
  | { type: "open" }
  | { type: "heart_rate"; value: { unit: "bpm"; value: number } }
  | null => {
  if (!tcxTarget) {
    return { type: "open" };
  }

  const targetType = tcxTarget["@_xsi:type"] as string | undefined;

  if (targetType === "None_t") {
    return { type: "open" };
  }

  if (targetType === "HeartRate_t") {
    // Try to extract heart rate zone or custom range
    const heartRateZone = tcxTarget.HeartRateZone as
      | Record<string, unknown>
      | undefined;
    if (heartRateZone) {
      const zoneType = heartRateZone["@_xsi:type"] as string | undefined;
      if (zoneType === "PredefinedHeartRateZone_t") {
        const zoneNumber = heartRateZone.Number as number | undefined;
        if (typeof zoneNumber === "number") {
          return {
            type: "heart_rate",
            value: { unit: "zone", value: zoneNumber },
          };
        }
      }
      if (zoneType === "CustomHeartRateZone_t") {
        const low = heartRateZone.Low as number | undefined;
        const high = heartRateZone.High as number | undefined;
        if (typeof low === "number" && typeof high === "number") {
          return {
            type: "heart_rate",
            value: { unit: "range", min: low, max: high },
          };
        }
      }
    }
  }

  logger.warn("Unsupported target type", { targetType });
  return { type: "open" };
};
