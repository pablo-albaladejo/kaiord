import {
  activityHashProjection,
  bodyCompositionHashProjection,
  dailyWellnessHashProjection,
  hrvHashProjection,
  plannedSessionHashProjection,
  sleepHashProjection,
  weightHashProjection,
} from "./managed-data-hash-projections";
import type {
  ManagedDataRegistryEntry,
  ManagedDataType,
} from "./managed-data-type";
import { activitySchema } from "./schemas/activity";
import {
  bodyCompositionSchema,
  dailyWellnessSchema,
  hrvSummarySchema,
  sleepRecordSchema,
  stressEpisodeSchema,
  weightMeasurementSchema,
} from "./schemas/health";
import { plannedSessionSchema } from "./schemas/planned-session";
import { trainingZonesSchema } from "./schemas/training-zones";
import { workoutSchema } from "./schemas/workout";

export const MANAGED_DATA_REGISTRY: Record<
  ManagedDataType,
  ManagedDataRegistryEntry
> = {
  workout: {
    label: "Workout",
    schema: workoutSchema,
    capabilities: { export: "write:workouts", import: "read:workouts" },
  },
  "planned-session": {
    label: "Planned Session",
    schema: plannedSessionSchema,
    // `read:training-plan` is the train2go-bridge wire token, kept mapped
    // N:1 to planned-session (permanent — no rename; see consensus MAJOR-C).
    capabilities: { import: "read:training-plan" },
    hashProjection: plannedSessionHashProjection,
  },
  activity: {
    label: "Activity",
    schema: activitySchema,
    capabilities: { import: "read:activities" },
    hashProjection: activityHashProjection,
  },
  "training-zones": {
    label: "Training Zones",
    schema: trainingZonesSchema,
    capabilities: { import: "read:training-zones" },
  },
  weight: {
    label: "Weight",
    schema: weightMeasurementSchema,
    capabilities: { import: "read:body" },
    hashProjection: weightHashProjection,
  },
  sleep: {
    label: "Sleep",
    schema: sleepRecordSchema,
    capabilities: { import: "read:sleep" },
    hashProjection: sleepHashProjection,
  },
  hrv: {
    label: "HRV",
    schema: hrvSummarySchema,
    capabilities: { import: "read:body" },
    hashProjection: hrvHashProjection,
  },
  "daily-wellness": {
    label: "Daily Wellness",
    schema: dailyWellnessSchema,
    capabilities: { import: "read:body" },
    hashProjection: dailyWellnessHashProjection,
  },
  "body-composition": {
    label: "Body Composition",
    schema: bodyCompositionSchema,
    capabilities: { import: "read:body" },
    hashProjection: bodyCompositionHashProjection,
  },
  stress: {
    label: "Stress",
    schema: stressEpisodeSchema,
    capabilities: { import: "read:body" },
  },
};
