/**
 * Calendar Domain - Types Barrel
 *
 * Re-exports records and schemas describing scheduled / executed workouts on
 * the calendar (raw input rows, persisted records, comments, AI metadata).
 */

export type {
  AiMeta,
  Condition,
  ValueWithUnit,
  WorkoutComment,
  WorkoutFeedback,
  WorkoutRaw,
  WorkoutRecord,
  WorkoutState,
} from "./calendar-schemas";
export {
  aiMetaSchema,
  conditionSchema,
  valueWithUnitSchema,
  workoutCommentSchema,
  workoutFeedbackSchema,
  workoutRawSchema,
  workoutRecordSchema,
  workoutStateSchema,
} from "./calendar-schemas";
