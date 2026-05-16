import { buildStructuredCyclingKrd } from "./build-structured-cycling-krd";

type WorkoutSeed = {
  profileId: string;
  source: string;
  workoutId: string;
  day: string;
  ts: string;
};

export const buildDummyWorkout = (ts: string) => ({
  id: "visual-dummy-out-of-week",
  date: "2020-01-01",
  state: "raw",
  sport: "cycling",
  source: "manual",
  sourceId: "visual-dummy",
  planId: null,
  raw: { description: "x", duration: { value: 600, unit: "s" } },
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: ts,
  modifiedAt: null,
  updatedAt: ts,
});

export const buildMatchedWorkout = (
  seed: WorkoutSeed,
  compositeId: string
) => ({
  id: seed.workoutId,
  profileId: seed.profileId,
  date: seed.day,
  state: "structured",
  sport: "cycling",
  source: seed.source,
  sourceId: compositeId,
  planId: null,
  raw: null,
  krd: buildStructuredCyclingKrd(seed.ts),
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: seed.ts,
  modifiedAt: null,
  updatedAt: seed.ts,
});
