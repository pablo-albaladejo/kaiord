/**
 * Type definitions for Garmin FIT SDK messages
 */

import type { fitMessageKeyEnum } from "./schemas/fit-message-keys";

export type FitMessages = {
  [fitMessageKeyEnum.enum.fileIdMesgs]?: Array<{
    type?: string;
    manufacturer?: string;
    product?: number;
    serialNumber?: number;
    timeCreated?: string | Date;
    garminProduct?: string;
  }>;
  [fitMessageKeyEnum.enum.workoutMesgs]?: Array<{
    wktName?: string;
    numValidSteps?: number;
    sport?: string;
    subSport?: string;
    poolLength?: number;
    poolLengthUnit?: number;
  }>;
  [fitMessageKeyEnum.enum.workoutStepMesgs]?: Array<{
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
    targetSwimStroke?: number;
    customTargetValueLow?: number;
    customTargetValueHigh?: number;
    customTargetPowerLow?: number;
    customTargetPowerHigh?: number;
    customTargetHeartRateLow?: number;
    customTargetHeartRateHigh?: number;
    customTargetCadenceLow?: number;
    customTargetCadenceHigh?: number;
    customTargetSpeedLow?: number;
    customTargetSpeedHigh?: number;
    intensity?: string;
    repeatSteps?: number;
    repeatHr?: number;
    notes?: string;
    equipment?: string;
  }>;
  [key: string]: Array<Record<string, unknown>> | undefined;
};

export type FitDeveloperField = {
  fieldDefinitionNumber: number;
  fieldName: string;
  nativeMesgNum: number;
  nativeFieldNum: number;
  units?: string;
  value: unknown;
};

export type FitExtensions = {
  developerFields?: Array<FitDeveloperField>;
  unknownMessages?: Record<string, Array<Record<string, unknown>>>;
};

export type FitFileId = NonNullable<
  FitMessages[typeof fitMessageKeyEnum.enum.fileIdMesgs]
>[number];
export type FitWorkoutMessage = NonNullable<
  FitMessages[typeof fitMessageKeyEnum.enum.workoutMesgs]
>[number];
export type FitWorkoutStep = NonNullable<
  FitMessages[typeof fitMessageKeyEnum.enum.workoutStepMesgs]
>[number];
