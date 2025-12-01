/**
 * Core Schema Exports
 *
 * Re-exports Zod schemas and types from @kaiord/core for use in the UI.
 */

export {
  durationSchema,
  durationTypeSchema,
  equipmentSchema,
  intensitySchema,
  krdEventSchema,
  krdLapSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
  repetitionBlockSchema,
  sportSchema,
  subSportSchema,
  swimStrokeSchema,
  targetSchema,
  targetTypeSchema,
  targetUnitSchema,
  workoutSchema,
  workoutStepSchema,
} from "@kaiord/core";

export type {
  Duration,
  DurationType,
  Equipment,
  Intensity,
  KRD,
  KRDEvent,
  KRDLap,
  KRDMetadata,
  KRDRecord,
  KRDSession,
  RepetitionBlock,
  Sport,
  SubSport,
  SwimStroke,
  Target,
  TargetType,
  TargetUnit,
  Workout,
  WorkoutStep,
} from "@kaiord/core";
