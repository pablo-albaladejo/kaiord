// KRD Schema and Types
export type {
  KRD,
  KRDEvent,
  KRDLap,
  KRDMetadata,
  KRDRecord,
  KRDSession,
} from "./krd";
export {
  krdEventSchema,
  krdLapSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
} from "./krd";

// Workout Schema and Types
export type { RepetitionBlock, Workout, WorkoutStep } from "./workout";
export {
  repetitionBlockSchema,
  workoutSchema,
  workoutStepSchema,
} from "./workout";

// Duration Schema and Types
export type { Duration, DurationType } from "./duration";
export { durationSchema, durationTypeSchema } from "./duration";

// Target Schema and Types
export type {
  CadenceValue,
  HeartRateValue,
  PaceValue,
  PowerValue,
  StrokeTypeValue,
  Target,
  TargetType,
  TargetUnit,
} from "./target";
export { targetSchema, targetTypeSchema, targetUnitSchema } from "./target";

// Enumeration Schemas and Types
export type { Equipment } from "./equipment";
export { equipmentSchema } from "./equipment";
export type { Intensity } from "./intensity";
export { intensitySchema } from "./intensity";
export type { Sport } from "./sport";
export { sportSchema } from "./sport";
export type { SubSport } from "./sub-sport";
export { subSportSchema } from "./sub-sport";
export type { SwimStroke } from "./swim-stroke";
export {
  FIT_TO_SWIM_STROKE,
  SWIM_STROKE_TO_FIT,
  swimStrokeSchema,
} from "./swim-stroke";

// File Type Schema and Types
export type { FileType } from "./file-type";
export { fileTypeSchema } from "./file-type";

// Length Unit Schema and Types
export type { LengthUnit } from "./length-unit";
export { lengthUnitSchema } from "./length-unit";

// KRD Lap Trigger Schema and Types
export type { KRDLapTrigger } from "./krd/lap";
export { krdLapTriggerSchema } from "./krd/lap";
