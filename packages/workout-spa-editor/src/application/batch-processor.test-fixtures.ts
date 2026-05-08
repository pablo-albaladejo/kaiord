/**
 * Test fixtures for batch-processor.test.ts.
 * Pure constants — no logic, no functions.
 */

import type { ProcessResult } from "./ai-workout-processor";

export const BATCH_PROCESSOR_IDS = {
  workoutIdPrefix: "550e8400-e29b-41d4-a716-44665544000",
} as const;

export const BATCH_PROCESSOR_COUNTS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
} as const;

export const BATCH_PROCESSOR_TIMING_MS = {
  zero: 0,
  apiCallSpacing: 500,
} as const;

export const BATCH_PROCESSOR_META = {
  promptVersion: "1.0.0",
  model: "m",
  provider: "p",
  processedAt: "2025-01-01T00:00:00Z",
  krdVersion: "1.0",
  krdType: "structured_workout",
  krdSport: "running",
  errorMessage: "LLM error",
} as const;

export const BATCH_PROCESSOR_OK_RESULT: ProcessResult = {
  ok: true,
  krd: {
    version: BATCH_PROCESSOR_META.krdVersion,
    type: "structured_workout",
    metadata: {
      created: BATCH_PROCESSOR_META.processedAt,
      sport: BATCH_PROCESSOR_META.krdSport,
    },
  },
  aiMeta: {
    promptVersion: BATCH_PROCESSOR_META.promptVersion,
    model: BATCH_PROCESSOR_META.model,
    provider: BATCH_PROCESSOR_META.provider,
    processedAt: BATCH_PROCESSOR_META.processedAt,
  },
  retried: false,
};

export const BATCH_PROCESSOR_FAIL_RESULT: ProcessResult = {
  ok: false,
  error: BATCH_PROCESSOR_META.errorMessage,
  retried: false,
};
