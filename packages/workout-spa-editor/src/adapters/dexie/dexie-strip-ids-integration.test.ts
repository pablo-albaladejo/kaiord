import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import { hydrateUIWorkout } from "../../store/hydrate-ui-workout";
import type { WorkoutRecord } from "../../types/calendar-schemas";
import { isRepetitionBlock } from "../../types/krd";
import type { KRD, Workout } from "../../types/krd";
import type { WorkoutTemplate } from "../../types/workout-library";
import { KaiordDatabase } from "./dexie-database";
import { createDexieTemplateRepository } from "./dexie-template-repository";
import { createDexieWorkoutRepository } from "./dexie-workout-repository";

const testDb = new KaiordDatabase("kaiord-strip-ids-test");

const buildKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-20T12:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: { type: "power", value: { unit: "watts", value: 200 } },
        },
        {
          repeatCount: 2,
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 60 },
              targetType: "power",
              target: { type: "power", value: { unit: "watts", value: 180 } },
            },
          ],
        },
      ],
    } as Workout,
  },
});

const assertNoIds = (krd: KRD | null | undefined) => {
  const workout = krd?.extensions?.structured_workout as Workout | undefined;
  expect(workout).toBeDefined();
  for (const item of workout!.steps) {
    expect((item as { id?: string }).id).toBeUndefined();
    if (isRepetitionBlock(item)) {
      for (const inner of item.steps) {
        expect((inner as { id?: string }).id).toBeUndefined();
      }
    }
  }
};

describe("Dexie write paths strip ids", () => {
  beforeEach(async () => {
    await testDb.table("workouts").clear();
    await testDb.table("templates").clear();
  });

  it("workout repository strips ids from persisted records", async () => {
    const ui = hydrateUIWorkout(buildKrd());
    const record: WorkoutRecord = {
      id: "00000000-0000-4000-8000-000000000111",
      date: "2026-04-20",
      sport: "cycling",
      source: "kaiord",
      sourceId: null,
      planId: null,
      state: "raw",
      raw: null,
      krd: ui,
      lastProcessingError: null,
      feedback: null,
      aiMeta: null,
      garminPushId: null,
      tags: [],
      previousState: null,
      createdAt: "2026-04-20T12:00:00Z",
      modifiedAt: null,
      updatedAt: "2026-04-20T12:00:00Z",
    };

    const repo = createDexieWorkoutRepository(testDb);
    await repo.put(record);
    const reloaded = await repo.getById(record.id);

    assertNoIds(reloaded?.krd ?? null);
  });

  it("template repository strips ids from persisted templates", async () => {
    const ui = hydrateUIWorkout(buildKrd());
    const template: WorkoutTemplate = {
      id: "00000000-0000-4000-8000-000000000222",
      name: "stripped template",
      sport: "cycling",
      krd: ui,
      tags: [],
      createdAt: "2026-04-20T12:00:00Z",
      updatedAt: "2026-04-20T12:00:00Z",
    };

    const repo = createDexieTemplateRepository(testDb);
    await repo.put(template);
    const reloaded = await repo.getById(template.id);

    expect(reloaded).toBeDefined();
    assertNoIds(reloaded!.krd);
  });
});
