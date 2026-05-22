import type { Logger } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { createCourseMessages } from "../course";
import { groupBodyCompositionMessages } from "../health/body-composition/body-composition-message-grouping";
import { convertFitToKrdHealthBodyComposition } from "../health/body-composition/fit-to-krd-health-body-composition.converter";
import { convertKrdToFitHealthBodyCompositionMessages } from "../health/body-composition/krd-health-body-composition-to-fit.converter";
import { groupDailyMessages } from "../health/daily/daily-message-grouping";
import { convertFitToKrdHealthDaily } from "../health/daily/fit-to-krd-health-daily.converter";
import { convertKrdToFitHealthDailyMessages } from "../health/daily/krd-health-daily-to-fit.converter";
import { convertFitToKrdHealthHrv } from "../health/hrv/fit-to-krd-health-hrv.converter";
import { groupHrvMessages } from "../health/hrv/hrv-message-grouping";
import { convertKrdToFitHealthHrvMessages } from "../health/hrv/krd-health-hrv-to-fit.converter";
import { convertFitToKrdHealthSleep } from "../health/sleep/fit-to-krd-health-sleep.converter";
import { convertKrdToFitHealthSleepMessages } from "../health/sleep/krd-health-sleep-to-fit.converter";
import { groupSleepMessages } from "../health/sleep/sleep-message-grouping";
import { convertFitToKrdHealthWeight } from "../health/weight/fit-to-krd-health-weight.converter";
import { convertKrdToFitHealthWeightMessages } from "../health/weight/krd-health-weight-to-fit.converter";
import { groupWeightMessages } from "../health/weight/weight-message-grouping";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import type { FitMessages } from "../shared/types";
import { mapActivityFileToKRD } from "./activity.mapper";
import { createActivityMessages } from "./activity-messages.creator";
import { detectFileType } from "./file-type-detector";
import { mapWorkoutFileToKRD } from "./workout.mapper";
import { groupWorkoutMessages } from "./workout-message-grouping";

export const mapMessagesToKRD = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  logger.debug("Mapping FIT messages to KRD", {
    messageCount: Object.keys(messages).length,
  });

  const fileType = detectFileType(messages);
  logger.debug("Detected file type", { fileType });

  switch (fileType) {
    case fileTypeSchema.enum.sleep_record:
      return convertFitToKrdHealthSleep(messages, logger);
    case fileTypeSchema.enum.weight_measurement:
      return convertFitToKrdHealthWeight(messages, logger);
    case fileTypeSchema.enum.body_composition:
      return convertFitToKrdHealthBodyComposition(messages, logger);
    case fileTypeSchema.enum.hrv_summary:
      return convertFitToKrdHealthHrv(messages, logger);
    case fileTypeSchema.enum.daily_wellness:
      return convertFitToKrdHealthDaily(messages, logger);
    case fileTypeSchema.enum.recorded_activity:
      return mapActivityFileToKRD(messages, logger);
    case fileTypeSchema.enum.structured_workout:
    default:
      return mapWorkoutFileToKRD(messages, logger);
  }
};

/**
 * Creates FIT messages from KRD format with file-type routing.
 */
export const createFitMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown[]> => {
  const fileType = krd.type;
  logger.debug("Creating FIT messages from KRD", { fileType });

  switch (fileType) {
    case "structured_workout":
      return groupWorkoutMessages(convertKRDToMessages(krd, logger));
    case "recorded_activity":
      return createActivityMessages(krd, logger);
    case "course":
      return createCourseMessages(krd, logger);
    case "sleep_record":
      return groupSleepMessages(
        convertKrdToFitHealthSleepMessages(krd, logger)
      );
    case "weight_measurement":
      return groupWeightMessages(
        convertKrdToFitHealthWeightMessages(krd, logger)
      );
    case "body_composition":
      return groupBodyCompositionMessages(
        convertKrdToFitHealthBodyCompositionMessages(krd, logger)
      );
    case "hrv_summary":
      return groupHrvMessages(convertKrdToFitHealthHrvMessages(krd, logger));
    case "daily_wellness":
      return groupDailyMessages(
        convertKrdToFitHealthDailyMessages(krd, logger)
      );
    default:
      throw new Error(`Unsupported FIT file type: ${fileType}`);
  }
};
