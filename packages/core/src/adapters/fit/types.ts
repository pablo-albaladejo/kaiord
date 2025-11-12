/**
 * Type definitions for Garmin FIT SDK messages
 */

import type { FIT_MESSAGE_KEY } from "./constants";

export type FitMessages = {
  [FIT_MESSAGE_KEY.FILE_ID]?: Array<{
    type?: string;
    manufacturer?: string;
    product?: number;
    serialNumber?: number;
    timeCreated?: string | Date;
    garminProduct?: string;
  }>;
  [FIT_MESSAGE_KEY.WORKOUT]?: Array<{
    wktName?: string;
    numValidSteps?: number;
    sport?: string;
  }>;
  [FIT_MESSAGE_KEY.WORKOUT_STEP]?: Array<{
    messageIndex?: number;
    wktStepName?: string;
    durationType?: string;
    durationValue?: number;
    durationTime?: number;
    durationDistance?: number;
    durationHr?: number;
    durationStep?: number;
    targetType?: string;
    targetValue?: number;
    targetHrZone?: number;
    targetPowerZone?: number;
    targetCadenceZone?: number;
    targetSpeedZone?: number;
    customTargetValueLow?: number;
    customTargetValueHigh?: number;
    intensity?: string;
    repeatSteps?: number;
  }>;
};

export type FitFileId = NonNullable<
  FitMessages[typeof FIT_MESSAGE_KEY.FILE_ID]
>[number];
export type FitWorkoutMessage = NonNullable<
  FitMessages[typeof FIT_MESSAGE_KEY.WORKOUT]
>[number];
export type FitWorkoutStep = NonNullable<
  FitMessages[typeof FIT_MESSAGE_KEY.WORKOUT_STEP]
>[number];
