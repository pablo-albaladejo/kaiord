// Training-plan and training-zones have no dedicated KRD schemas yet;
// a passthrough z.unknown() stands in until their schemas are introduced.
import { z } from "zod";

import type {
  ManagedDataRegistryEntry,
  ManagedDataType,
} from "./managed-data-type";
import {
  bodyCompositionSchema,
  dailyWellnessSchema,
  hrvSummarySchema,
  sleepRecordSchema,
  stressEpisodeSchema,
  weightMeasurementSchema,
} from "./schemas/health";
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
  "training-plan": {
    label: "Training Plan",
    schema: z.unknown(),
    capabilities: { import: "read:training-plan" },
  },
  "training-zones": {
    label: "Training Zones",
    schema: z.unknown(),
    capabilities: { import: "read:training-zones" },
  },
  weight: {
    label: "Weight",
    schema: weightMeasurementSchema,
    capabilities: { import: "read:body" },
    hashProjection: (p) => {
      const payload = p as { weightKilograms?: unknown; measuredAt?: unknown };
      return { kg: payload.weightKilograms, measuredAt: payload.measuredAt };
    },
  },
  sleep: {
    label: "Sleep",
    schema: sleepRecordSchema,
    capabilities: { import: "read:sleep" },
    hashProjection: (p) => {
      const payload = p as {
        totalDurationSeconds?: unknown;
        startTime?: unknown;
      };
      return {
        totalMinutes: payload.totalDurationSeconds,
        startedAt: payload.startTime,
      };
    },
  },
  hrv: {
    label: "HRV",
    schema: hrvSummarySchema,
    capabilities: { import: "read:body" },
    hashProjection: (p) => {
      const payload = p as { rMSSD?: unknown; measuredAt?: unknown };
      return { rMSSD: payload.rMSSD, measuredAt: payload.measuredAt };
    },
  },
  "daily-wellness": {
    label: "Daily Wellness",
    schema: dailyWellnessSchema,
    capabilities: { import: "read:body" },
    hashProjection: (p) => {
      const payload = p as { steps?: unknown; date?: unknown };
      return { steps: payload.steps, date: payload.date };
    },
  },
  "body-composition": {
    label: "Body Composition",
    schema: bodyCompositionSchema,
    capabilities: { import: "read:body" },
    hashProjection: (p) => {
      const payload = p as {
        bodyFatPercent?: unknown;
        measuredAt?: unknown;
      };
      return {
        bodyFatPercent: payload.bodyFatPercent,
        measuredAt: payload.measuredAt,
      };
    },
  },
  stress: {
    label: "Stress",
    schema: stressEpisodeSchema,
    capabilities: { import: "read:body" },
  },
};
