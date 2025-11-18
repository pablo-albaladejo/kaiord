import { XMLBuilder } from "fast-xml-parser";
import type { KRD } from "../../domain/schemas/krd";
import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../domain/schemas/workout";
import { createZwiftParsingError } from "../../domain/types/errors";
import type { Logger } from "../../ports/logger";
import { buildWorkoutFile } from "./krd-to-zwift/workout-file-builder";

const extractWorkoutData = (krd: KRD) => {
  const workout = krd.extensions?.workout;
  if (!workout || typeof workout !== "object") {
    throw createZwiftParsingError("KRD missing workout in extensions");
  }

  return workout as {
    name?: string;
    sport?: string;
    steps?: Array<WorkoutStep | RepetitionBlock>;
  };
};

const buildXmlString = (workoutFile: Record<string, unknown>): string => {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    indentBy: "  ",
  });

  // Add kaiord namespace for round-trip data preservation
  const workoutFileWithNamespace = {
    "@_xmlns:kaiord": "http://kaiord.dev/zwift-extensions/1.0",
    ...workoutFile,
  };

  const xmlObj = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "UTF-8",
    },
    workout_file: workoutFileWithNamespace,
  };

  return builder.build(xmlObj) as string;
};

export const convertKRDToZwift = (krd: KRD, logger: Logger): string => {
  logger.debug("Building Zwift workout structure from KRD");

  const workoutData = extractWorkoutData(krd);
  const zwiftExtensions = (krd.extensions?.zwift || {}) as Record<
    string,
    unknown
  >;

  const workoutFile = buildWorkoutFile(
    workoutData,
    zwiftExtensions,
    krd.metadata,
    krd.extensions?.fit as Record<string, unknown> | undefined,
    logger
  );
  const xmlString = buildXmlString(workoutFile);

  logger.debug("Zwift XML structure built successfully");
  return xmlString;
};
