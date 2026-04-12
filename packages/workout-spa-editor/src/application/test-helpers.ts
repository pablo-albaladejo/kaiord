/**
 * Application Test Helpers
 *
 * Factory functions for building test fixtures.
 */

import type { WorkoutRecord } from "../types/calendar-record";
import type { KRD } from "../types/schemas";

export function makeWorkoutRecord(
  overrides: Partial<WorkoutRecord> = {}
): WorkoutRecord {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    date: "2025-01-15",
    sport: "running",
    source: "train2go",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: {
      title: "Easy run",
      description: "10K zone 2",
      comments: [],
      distance: null,
      duration: null,
      prescribedRpe: null,
      rawHash: "abc123",
    },
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2025-01-15T08:00:00Z",
    modifiedAt: null,
    updatedAt: "2025-01-15T08:00:00Z",
    ...overrides,
  };
}

export function makeValidKrd(stepCount = 3, estimatedDuration = 3600): KRD {
  return {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
        name: "Test workout",
        sport: "running",
        steps: Array.from({ length: stepCount }, (_, i) => ({
          order: i + 1,
          type: "active",
        })),
        estimatedDuration,
      },
    },
  };
}
