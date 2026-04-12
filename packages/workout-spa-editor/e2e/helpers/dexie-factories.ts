/**
 * Factory functions for e2e test data.
 *
 * Creates WorkoutRecord and WorkoutTemplate objects
 * compatible with the Dexie schema.
 */

const makeStep = () => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 200 } },
  intensity: "active",
});

const makeKrd = (name: string, sport: string) => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: new Date().toISOString(), sport },
  extensions: {
    structured_workout: { name, sport, steps: [makeStep()] },
  },
});

/** Factory for a minimal WorkoutRecord. */
export function makeWorkout(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    date: now.slice(0, 10),
    sport: "running",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: makeKrd("Test", "running"),
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
    ...overrides,
  };
}

/** Factory for a RAW workout (e.g. from a coach). */
export function makeRawWorkout(date: string, title: string) {
  return makeWorkout({
    date,
    state: "raw",
    krd: null,
    raw: {
      title,
      description: "2K z1 + 3K z3 + 2K z1",
      comments: [
        {
          author: "coach",
          text: "lleva geles",
          timestamp: `${date}T08:00:00Z`,
        },
      ],
      distance: { value: 15, unit: "km" },
      duration: null,
      prescribedRpe: 7,
      rawHash: "abc123",
    },
  });
}

/** Factory for a template record. */
export function makeTemplate(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test Template",
    sport: "cycling",
    krd: makeKrd("Template", "cycling"),
    tags: [],
    difficulty: "moderate",
    duration: 3600,
    notes: "",
    thumbnailData: "",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
