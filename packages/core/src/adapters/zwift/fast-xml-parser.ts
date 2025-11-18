import { XMLBuilder, XMLParser } from "fast-xml-parser";
import type { KRD } from "../../domain/schemas/krd";
import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../domain/schemas/workout";
import {
  createZwiftParsingError,
  createZwiftValidationError,
} from "../../domain/types/errors";
import type { Logger } from "../../ports/logger";
import type { ZwiftReader } from "../../ports/zwift-reader";
import type { ZwiftValidator } from "../../ports/zwift-validator";
import type { ZwiftWriter } from "../../ports/zwift-writer";
import { mapFreeRideToKrd } from "./interval/free-ride.mapper";
import { detectIntervalType } from "./interval/interval-type-detector";
import { mapIntervalsTToKrd } from "./interval/intervals-t.mapper";
import {
  mapCooldownToKrd,
  mapRampToKrd,
  mapWarmupToKrd,
} from "./interval/ramp.mapper";
import { mapSteadyStateToKrd } from "./interval/steady-state.mapper";

export const createFastXmlZwiftReader =
  (logger: Logger, validator: ZwiftValidator): ZwiftReader =>
  async (xmlString: string): Promise<KRD> => {
    logger.debug("Validating Zwift file against XSD", {
      xmlLength: xmlString.length,
    });

    const validationResult = await validator(xmlString);
    if (!validationResult.valid) {
      logger.error("Zwift file does not conform to XSD schema", {
        errors: validationResult.errors,
      });
      throw createZwiftValidationError(
        "Zwift file does not conform to XSD schema",
        validationResult.errors
      );
    }

    logger.debug("Parsing Zwift file");

    let zwiftData: unknown;
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });

      zwiftData = parser.parse(xmlString);
    } catch (error) {
      logger.error("Failed to parse Zwift XML", { error });
      throw createZwiftParsingError("Failed to parse Zwift file", error);
    }

    if (
      !zwiftData ||
      typeof zwiftData !== "object" ||
      !("workout_file" in zwiftData)
    ) {
      const error = createZwiftParsingError(
        "Invalid Zwift format: missing workout_file element"
      );
      logger.error("Invalid Zwift structure", { error });
      throw error;
    }

    logger.info("Zwift file parsed successfully");

    return convertZwiftToKRD(zwiftData, logger);
  };

const convertZwiftToKRD = (zwiftData: unknown, logger: Logger): KRD => {
  logger.debug("Converting Zwift to KRD");

  const workoutFile = (zwiftData as { workout_file: unknown }).workout_file as {
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

  const sport =
    workoutFile.sportType === "bike"
      ? "cycling"
      : workoutFile.sportType === "run"
        ? "running"
        : "generic";

  const zwiftExtensions: Record<string, unknown> = {
    author: workoutFile.author,
    description: workoutFile.description,
    tags: extractTags(workoutFile.tags),
  };

  // Preserve durationType if present
  if (workoutFile.durationType !== undefined) {
    zwiftExtensions.durationType = workoutFile.durationType;
  }

  // Preserve thresholdSecPerKm if present
  if (workoutFile.thresholdSecPerKm !== undefined) {
    zwiftExtensions.thresholdSecPerKm = workoutFile.thresholdSecPerKm;
  }

  // Process workout intervals
  const steps: Array<WorkoutStep | RepetitionBlock> = [];
  if (workoutFile.workout) {
    const intervals = extractIntervals(workoutFile.workout);
    let stepIndex = 0;

    for (const interval of intervals) {
      const durationType = workoutFile.durationType as
        | "time"
        | "distance"
        | undefined;

      if (interval.type === "SteadyState") {
        steps.push(
          mapSteadyStateToKrd({
            ...interval.data,
            stepIndex,
            durationType,
          })
        );
        stepIndex++;
      } else if (interval.type === "Warmup") {
        steps.push(
          mapWarmupToKrd({
            ...interval.data,
            stepIndex,
            durationType,
          })
        );
        stepIndex++;
      } else if (interval.type === "Ramp") {
        steps.push(
          mapRampToKrd({
            ...interval.data,
            stepIndex,
            durationType,
          })
        );
        stepIndex++;
      } else if (interval.type === "Cooldown") {
        steps.push(
          mapCooldownToKrd({
            ...interval.data,
            stepIndex,
            durationType,
          })
        );
        stepIndex++;
      } else if (interval.type === "IntervalsT") {
        const repetitionBlock = mapIntervalsTToKrd({
          ...interval.data,
          stepIndex,
          durationType,
        });
        steps.push(repetitionBlock);
        stepIndex += repetitionBlock.steps.length;
      } else if (interval.type === "FreeRide") {
        steps.push(
          mapFreeRideToKrd({
            ...interval.data,
            stepIndex,
            durationType,
          })
        );
        stepIndex++;
      }
    }
  }

  const krd: KRD = {
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
      zwift: zwiftExtensions,
    },
  };

  logger.debug("Zwift to KRD conversion complete");
  return krd;
};

const extractTags = (
  tags: { tag?: Array<{ "@_name": string }> | { "@_name": string } } | undefined
): Array<string> => {
  if (!tags || !tags.tag) {
    return [];
  }

  if (Array.isArray(tags.tag)) {
    return tags.tag.map((t) => t["@_name"]);
  }

  return [tags.tag["@_name"]];
};

type ZwiftInterval = {
  type:
    | "SteadyState"
    | "Warmup"
    | "Ramp"
    | "Cooldown"
    | "IntervalsT"
    | "FreeRide";
  data: Record<string, unknown>;
};

const extractIntervals = (
  workout: Record<string, unknown>
): Array<ZwiftInterval> => {
  const intervals: Array<ZwiftInterval> = [];
  const intervalTypes = [
    "SteadyState",
    "Warmup",
    "Ramp",
    "Cooldown",
    "IntervalsT",
    "FreeRide",
  ];

  for (const type of intervalTypes) {
    if (workout[type]) {
      const data = workout[type];
      if (Array.isArray(data)) {
        for (const item of data) {
          intervals.push({
            type: type as ZwiftInterval["type"],
            data: normalizeAttributes(item),
          });
        }
      } else {
        intervals.push({
          type: type as ZwiftInterval["type"],
          data: normalizeAttributes(data as Record<string, unknown>),
        });
      }
    }
  }

  return intervals;
};

const normalizeAttributes = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("@_")) {
      // Remove @_ prefix from attributes
      normalized[key.substring(2)] = value;
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
};

export const createFastXmlZwiftWriter =
  (logger: Logger, validator: ZwiftValidator): ZwiftWriter =>
  async (krd: KRD): Promise<string> => {
    logger.debug("Converting KRD to Zwift format");

    let xmlString: string;
    try {
      xmlString = convertKRDToZwift(krd, logger);
    } catch (error) {
      logger.error("Failed to convert KRD to Zwift", { error });
      throw createZwiftParsingError("Failed to convert KRD to Zwift", error);
    }

    logger.debug("Validating generated Zwift XML against XSD", {
      xmlLength: xmlString.length,
    });

    const validationResult = await validator(xmlString);
    if (!validationResult.valid) {
      logger.error("Generated Zwift XML does not conform to XSD schema", {
        errors: validationResult.errors,
      });
      throw createZwiftValidationError(
        "Generated Zwift XML does not conform to XSD schema",
        validationResult.errors
      );
    }

    logger.info("KRD to Zwift conversion successful");
    return xmlString;
  };

const convertKRDToZwift = (krd: KRD, logger: Logger): string => {
  logger.debug("Building Zwift workout structure from KRD");

  // Extract workout from extensions
  const workout = krd.extensions?.workout;
  if (!workout || typeof workout !== "object") {
    throw createZwiftParsingError("KRD missing workout in extensions");
  }

  const workoutData = workout as {
    name?: string;
    sport?: string;
    steps?: Array<WorkoutStep | RepetitionBlock>;
  };

  // Extract Zwift extensions
  const zwiftExtensions = (krd.extensions?.zwift || {}) as Record<
    string,
    unknown
  >;

  // Map sport
  const sportType =
    workoutData.sport === "cycling"
      ? "bike"
      : workoutData.sport === "running"
        ? "run"
        : "bike";

  // Build workout_file structure
  const workoutFile: Record<string, unknown> = {
    "@_xmlns": "http://www.zwift.com/workouts",
  };

  // Add metadata
  if (zwiftExtensions.author) {
    workoutFile.author = zwiftExtensions.author;
  }
  if (workoutData.name) {
    workoutFile.name = workoutData.name;
  }
  if (zwiftExtensions.description) {
    workoutFile.description = zwiftExtensions.description;
  }
  workoutFile.sportType = sportType;

  // Add optional Zwift-specific fields
  if (zwiftExtensions.durationType) {
    workoutFile.durationType = zwiftExtensions.durationType;
  }
  if (zwiftExtensions.thresholdSecPerKm !== undefined) {
    workoutFile.thresholdSecPerKm = zwiftExtensions.thresholdSecPerKm;
  }

  // Add tags
  const tags = zwiftExtensions.tags as Array<string> | undefined;
  if (tags && tags.length > 0) {
    workoutFile.tags = {
      tag: tags.map((name) => ({ "@_name": name })),
    };
  }

  // Convert steps to Zwift intervals
  const intervals = convertStepsToZwiftIntervals(
    workoutData.steps || [],
    logger
  );
  workoutFile.workout = intervals;

  // Build XML using fast-xml-parser
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    indentBy: "  ",
  });

  const xmlObj = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "UTF-8",
    },
    workout_file: workoutFile,
  };

  const xmlString = builder.build(xmlObj) as string;

  logger.debug("Zwift XML structure built successfully");
  return xmlString;
};

const convertStepsToZwiftIntervals = (
  steps: Array<WorkoutStep | RepetitionBlock>,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Converting KRD steps to Zwift intervals", {
    stepCount: steps.length,
  });

  const intervals: Record<string, Array<Record<string, unknown>>> = {};

  for (const step of steps) {
    // Check if it's a repetition block
    if ("repeatCount" in step) {
      // IntervalsT encoding
      const repetitionBlock = step as RepetitionBlock;
      if (repetitionBlock.steps.length === 2) {
        const intervalsT = encodeIntervalsT(repetitionBlock);

        if (!intervals.IntervalsT) {
          intervals.IntervalsT = [];
        }
        intervals.IntervalsT.push(intervalsT);
      }
    } else {
      // Regular workout step
      const workoutStep = step as WorkoutStep;
      const intervalType = determineIntervalType(workoutStep);
      const interval = convertStepToInterval(workoutStep, intervalType);

      if (!intervals[intervalType]) {
        intervals[intervalType] = [];
      }
      intervals[intervalType].push(interval);
    }
  }

  return intervals;
};

const encodeIntervalsT = (
  repetitionBlock: RepetitionBlock
): Record<string, unknown> => {
  const onStep = repetitionBlock.steps[0];
  const offStep = repetitionBlock.steps[1];

  const intervalsT: Record<string, unknown> = {
    "@_Repeat": repetitionBlock.repeatCount,
  };

  // Add durations
  if (onStep.duration.type === "time") {
    intervalsT["@_OnDuration"] = onStep.duration.seconds;
  } else if (onStep.duration.type === "distance") {
    intervalsT["@_OnDuration"] = onStep.duration.meters;
  }

  if (offStep.duration.type === "time") {
    intervalsT["@_OffDuration"] = offStep.duration.seconds;
  } else if (offStep.duration.type === "distance") {
    intervalsT["@_OffDuration"] = offStep.duration.meters;
  }

  // Add power targets if present
  if (
    onStep.target.type === "power" &&
    onStep.target.value.unit === "percent_ftp"
  ) {
    intervalsT["@_OnPower"] = onStep.target.value.value / 100;
  }
  if (
    offStep.target.type === "power" &&
    offStep.target.value.unit === "percent_ftp"
  ) {
    intervalsT["@_OffPower"] = offStep.target.value.value / 100;
  }

  // Add cadence if present (either as target or in extensions)
  if (onStep.target.type === "cadence" && onStep.target.value.unit === "rpm") {
    intervalsT["@_Cadence"] = onStep.target.value.value;
  } else {
    const onStepExtensions = onStep.extensions?.zwift as
      | Record<string, unknown>
      | undefined;
    const cadence = onStepExtensions?.cadence as number | undefined;
    if (cadence !== undefined) {
      intervalsT["@_Cadence"] = cadence;
    }
  }

  if (
    offStep.target.type === "cadence" &&
    offStep.target.value.unit === "rpm"
  ) {
    intervalsT["@_CadenceResting"] = offStep.target.value.value;
  } else {
    const offStepExtensions = offStep.extensions?.zwift as
      | Record<string, unknown>
      | undefined;
    const cadenceResting = offStepExtensions?.cadence as number | undefined;
    if (cadenceResting !== undefined) {
      intervalsT["@_CadenceResting"] = cadenceResting;
    }
  }

  // Encode text events from the on step
  const textEvents = encodeTextEvents(onStep);
  if (textEvents) {
    intervalsT.textevent = textEvents;
  }

  return intervalsT;
};

const determineIntervalType = (step: WorkoutStep): string => {
  return detectIntervalType(step);
};

const encodeTextEvents = (
  step: WorkoutStep
): Array<Record<string, unknown>> | Record<string, unknown> | undefined => {
  const stepExtensions = step.extensions?.zwift as
    | Record<string, unknown>
    | undefined;
  const textEvents = stepExtensions?.textEvents as
    | Array<Record<string, unknown>>
    | undefined;

  if (!textEvents || textEvents.length === 0) {
    return undefined;
  }

  // If single text event, return as object
  if (textEvents.length === 1) {
    const event = textEvents[0];
    const encoded: Record<string, unknown> = {
      "@_message": event.message,
    };

    if (event.timeoffset !== undefined) {
      encoded["@_timeoffset"] = event.timeoffset;
    }
    if (event.distoffset !== undefined) {
      encoded["@_distoffset"] = event.distoffset;
    }

    return encoded;
  }

  // Multiple text events, return as array
  return textEvents.map((event) => {
    const encoded: Record<string, unknown> = {
      "@_message": event.message,
    };

    if (event.timeoffset !== undefined) {
      encoded["@_timeoffset"] = event.timeoffset;
    }
    if (event.distoffset !== undefined) {
      encoded["@_distoffset"] = event.distoffset;
    }

    return encoded;
  });
};

const convertStepToInterval = (
  step: WorkoutStep,
  intervalType: string
): Record<string, unknown> => {
  const interval: Record<string, unknown> = {};

  // Add duration
  if (step.duration.type === "time") {
    interval["@_Duration"] = step.duration.seconds;
  } else if (step.duration.type === "distance") {
    interval["@_Duration"] = step.duration.meters;
  }

  // Add targets based on interval type
  if (intervalType === "SteadyState") {
    if (
      step.target.type === "power" &&
      step.target.value.unit === "percent_ftp"
    ) {
      interval["@_Power"] = step.target.value.value / 100;
    } else if (step.target.type === "pace") {
      // Convert m/s to sec/km
      interval["@_pace"] = 1000 / step.target.value.value;
    }
  } else if (
    intervalType === "Warmup" ||
    intervalType === "Ramp" ||
    intervalType === "Cooldown"
  ) {
    if (step.target.type === "power" && step.target.value.unit === "range") {
      interval["@_PowerLow"] = step.target.value.min / 100;
      interval["@_PowerHigh"] = step.target.value.max / 100;
    }
  } else if (intervalType === "FreeRide") {
    // FreeRide may have cadence
    if (step.target.type === "cadence") {
      interval["@_Cadence"] = step.target.value.value;
    }

    // Restore FlatRoad from extensions
    const stepExtensions = step.extensions?.zwift as
      | Record<string, unknown>
      | undefined;
    if (stepExtensions?.FlatRoad !== undefined) {
      interval["@_FlatRoad"] = stepExtensions.FlatRoad;
    }
  }

  // Add cadence for all interval types if present
  if (step.target.type === "cadence") {
    interval["@_Cadence"] = step.target.value.value;
  }

  // Encode text events
  const textEvents = encodeTextEvents(step);
  if (textEvents) {
    interval.textevent = textEvents;
  }

  return interval;
};
