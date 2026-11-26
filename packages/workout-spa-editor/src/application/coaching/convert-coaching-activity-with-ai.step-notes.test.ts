/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { StepNote, StepNotesInput } from "@kaiord/ai/agents";
import { isAiNote, type KRD } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { parseActivitySteps } from "../../adapters/train2go/connector/parse-activity-steps";
import { createInMemoryAthleteNoteRepository } from "../../test-utils/in-memory-athlete-note-repository";
import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { WorkoutStep } from "../../types/schemas";
import { getStructuredWorkout } from "../../utils/structured-workout";
import {
  convertCoachingActivityWithAi,
  type ConvertWithAiDeps,
} from "./convert-coaching-activity-with-ai";
import {
  buildStubAnalytics,
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  fakeAiMeta,
  fakeKrd,
  passThroughTransaction,
  stubActivity,
} from "./convert-coaching-activity-with-ai.test-helpers";
import { createReadStepsTable } from "./read-steps-table";
import type { GenerateStepNotesPort } from "./table-step-notes";

// Synthetic: Train2Go's markup shape with invented zones and values.
const TABLE = parseActivitySteps(
  readFileSync(
    join(
      __dirname,
      "../../adapters/train2go/connector/fixtures/daily-with-steps.html"
    ),
    "utf-8"
  )
);
const COACH_TEXT =
  'Rodaje de prueba siguiendo las zonas de potencia. Incluye 3 x 30" de pedalada a una pierna.';
const CUE = "Pedalada a una pierna";
const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
const NOW = "2026-11-25T10:00:00.000Z";

/** A model that puts the coach's cue on every 30 s step. */
const cueOnShortSteps = async (input: StepNotesInput): Promise<StepNote[]> =>
  input.steps.flatMap((line, i) =>
    line.startsWith("30 s ")
      ? [{ step: i + 1, text: CUE, origin: "coach" as const }]
      : []
  );

const setup = (generateStepNotes: GenerateStepNotesPort) => {
  const activity: CoachingActivityRecord = stubActivity({
    description: COACH_TEXT,
    structuredSteps: TABLE,
  });
  const deps: ConvertWithAiDeps = {
    coaching: buildStubCoachingRepo([activity]),
    workouts: buildStubWorkoutRepo([]),
    sessionMatches: createInMemorySessionMatchRepository(),
    athleteNotes: createInMemoryAthleteNoteRepository(),
    transaction: passThroughTransaction,
    analytics: buildStubAnalytics(),
    generateKrd: vi
      .fn()
      .mockResolvedValue({ krd: fakeKrd(), aiMeta: fakeAiMeta() }),
    generateStepNotes: vi.fn(generateStepNotes),
    readStepsTable: createReadStepsTable(() => NOW),
    newWorkoutId: () => "w-new",
    newMatchId: () => "M-new",
    clock: () => NOW,
  };
  return { activity, deps };
};

const convert = async (generateStepNotes: GenerateStepNotesPort) => {
  const { activity, deps } = setup(generateStepNotes);
  const result = await convertCoachingActivityWithAi(
    { activityId: activity.id },
    deps
  );
  if (!result.ok) throw new Error(result.reason);
  const stored = await deps.workouts.getById(result.workoutId);
  const workout = stored?.krd && getStructuredWorkout(stored.krd);
  return { result, deps, workout };
};

type Leaf = WorkoutStep;
const leaves = (steps: unknown[] = []): Leaf[] =>
  steps.flatMap((s) =>
    "steps" in (s as object) ? (s as { steps: Leaf[] }).steps : [s as Leaf]
  );

/** Each step's structure: everything but its note and the note's origin. */
const structureOf = (steps: unknown[] = []) =>
  JSON.parse(
    JSON.stringify(steps, (key, value) =>
      key === "notes" || key === "extensions" ? undefined : value
    )
  );

describe("convertCoachingActivityWithAi step notes from a steps table", () => {
  it("should put the coach's cue on the three 30 s steps, followed by the HR range", async () => {
    // Arrange

    // Act
    const { workout, deps } = await convert(cueOnShortSteps);

    // Assert
    const short = leaves(workout?.steps).filter(
      (s) => s.duration.type === "time" && s.duration.seconds === 30
    );
    expect(short.map((s) => s.notes)).toStrictEqual([
      `${CUE} · HR 121-130 bpm`,
      `${CUE} · HR 121-130 bpm`,
      `${CUE} · HR 121-130 bpm`,
    ]);
    expect(
      leaves(workout?.steps).find((s) => s.notes === "HR 60-120 bpm")
    ).toBeDefined();
    expect(deps.generateKrd).not.toHaveBeenCalled();
    expect(workout?.notes).toBe(COACH_TEXT);
  });

  it("should send the notes call the coach's text and one line per step", async () => {
    // Arrange

    // Act
    const { deps } = await convert(cueOnShortSteps);

    // Assert
    const input = vi.mocked(deps.generateStepNotes).mock.calls[0]?.[0];
    expect(input?.coachText).toBe(COACH_TEXT);
    expect(input?.steps.slice(0, 3)).toStrictEqual([
      "900 s R0",
      "60 s R1",
      "60 s R0",
    ]);
  });

  it("should change no duration, target or repeat whatever the notes call answers", async () => {
    // Arrange
    const hostile = async (input: StepNotesInput) =>
      input.steps.map((_, i) => ({
        step: i + 1,
        text: "Sprint",
        origin: "ai",
        duration: { type: "time", seconds: 9999 },
        target: { type: "power", value: { unit: "watts", value: 999 } },
        repeatCount: 99,
        steps: [],
      })) as unknown as StepNote[];
    const { workout: plain } = await convert(async () => null);

    // Act
    const { workout } = await convert(hostile);

    // Assert
    expect(structureOf(workout?.steps)).toStrictEqual(
      structureOf(plain?.steps)
    );
    expect(
      leaves(workout?.steps).every((s) => s.notes?.startsWith("Sprint · HR "))
    ).toBe(true);
  });

  it("should keep the steps and HR ranges and say the notes could not be added when the call fails", async () => {
    // Arrange
    const failing = async () => {
      throw new Error("offline");
    };

    // Act
    const { result, workout } = await convert(failing);

    // Assert
    expect(result).toMatchObject({ ok: true, stepNotesFailed: true });
    expect(
      leaves(workout?.steps).every((s) =>
        /^HR \d+-\d+ bpm$/.test(s.notes ?? "")
      )
    ).toBe(true);
  });

  it("should add only the HR ranges, with no notice, when no AI is configured", async () => {
    // Arrange

    // Act
    const { result, workout } = await convert(async () => null);

    // Assert
    expect(result).not.toHaveProperty("stepNotesFailed");
    expect(
      leaves(workout?.steps).every((s) =>
        /^HR \d+-\d+ bpm$/.test(s.notes ?? "")
      )
    ).toBe(true);
  });

  it("should cut a long coach cue, never the HR range, in the note sent to Garmin", async () => {
    // Arrange
    const cue =
      "Pedalada a una pierna, alternando cada 30 segundos, con la cadera quieta, el tronco relajado y la rodilla alineada con el pie, empujando y tirando del pedal en todo el recorrido sin perder la cadencia ni la postura.";
    const long = async (): Promise<StepNote[]> => [
      { step: 1, text: cue.repeat(2), origin: "coach" },
    ];
    const { deps, result } = await convert(long);
    const stored = await deps.workouts.getById(
      result.ok ? result.workoutId : ""
    );

    // Act
    const { createGarminWriter } = await import("@kaiord/garmin");
    const gcn = JSON.parse(
      await createGarminWriter(silentLogger)(stored?.krd as KRD)
    );

    // Assert
    const sent: string = gcn.workoutSegments[0].workoutSteps[0].description;
    expect(sent.length).toBeLessThanOrEqual(200);
    expect(sent.startsWith("Pedalada a una pierna")).toBe(true);
    expect(sent.endsWith(" · HR 60-120 bpm")).toBe(true);
  });

  it("should mark a note the AI wrote on its own and not the coach's cue", async () => {
    // Arrange
    const mixed = async (): Promise<StepNote[]> => [
      { step: 1, text: "Rueda suave", origin: "ai" },
      { step: 2, text: CUE, origin: "coach" },
    ];

    // Act
    const { workout } = await convert(mixed);

    // Assert
    const [first, second] = leaves(workout?.steps);
    expect(first && isAiNote(first)).toBe(true);
    expect(second && isAiNote(second)).toBe(false);
  });
});
