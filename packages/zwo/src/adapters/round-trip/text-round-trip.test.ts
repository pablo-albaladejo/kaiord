import type { KRD, RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { createMockLogger, loadKrdFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

const logger = createMockLogger();
const validator = createXsdZwiftValidator(logger);
const reader = createFastXmlZwiftReader(logger, validator);
const writer = createFastXmlZwiftWriter(logger, validator);

type TextEvent = { message: string; timeoffset?: number };

const workoutOf = (krd: KRD) =>
  krd.extensions?.structured_workout as {
    name?: string;
    steps: Array<WorkoutStep | RepetitionBlock>;
  };

const textEventsOf = (step: WorkoutStep) =>
  (step.extensions?.zwift as { textEvents?: Array<TextEvent> } | undefined)
    ?.textEvents;

const withTextEvents = (
  step: WorkoutStep,
  textEvents: Array<TextEvent>
): WorkoutStep => ({
  ...step,
  notes: textEvents[0]!.message,
  extensions: { ...step.extensions, zwift: { textEvents } },
});

// WorkoutRepeatSteps: steady _A_, IntervalsT ×3 [B1_, B2_], steady _C_.
const repeatStepsWith = (
  edit: (steps: {
    first: WorkoutStep;
    on: WorkoutStep;
    off: WorkoutStep;
  }) => Partial<Record<"first" | "on" | "off", WorkoutStep>>
): KRD => {
  const krd = loadKrdFixture("WorkoutRepeatSteps.krd");
  const steps = workoutOf(krd).steps;
  const block = steps[1] as RepetitionBlock;
  const edited = edit({
    first: steps[0] as WorkoutStep,
    on: block.steps[0]!,
    off: block.steps[1]!,
  });
  if (edited.first) steps[0] = edited.first;
  if (edited.on) block.steps[0] = edited.on;
  if (edited.off) block.steps[1] = edited.off;
  return krd;
};

const stepsOf = (krd: KRD) => {
  const steps = workoutOf(krd).steps;
  const block = steps[1] as RepetitionBlock;
  return {
    first: steps[0] as WorkoutStep,
    on: block.steps[0]!,
    off: block.steps[1]!,
  };
};

describe("Zwift Round-trip: text fields", () => {
  it(
    "should keep numeric names and messages as strings",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const krd = repeatStepsWith(({ first, on, off }) => ({
        first: withTextEvents({ ...first, name: "1" }, [
          { message: "10", timeoffset: 5 },
        ]),
        on: { ...on, name: "30" },
        off: { ...off, name: "007" },
      }));
      workoutOf(krd).name = "42";

      // Act
      const steps = stepsOf(await reader(await writer(krd)));

      // Assert
      expect(steps.first.name).toBe("1");
      expect(steps.on.name).toBe("30");
      expect(steps.off.name).toBe("007");
      expect(steps.first.notes).toBe("10");
      expect(textEventsOf(steps.first)).toStrictEqual([
        { message: "10", timeoffset: 5 },
      ]);
    }
  );

  it(
    "should read numeric text from native ZWO as strings and numeric attributes as numbers",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file xmlns:kaiord="http://kaiord.dev/zwift-extensions/1.0">
  <author>7</author>
  <name>42</name>
  <description>3</description>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="0.8" kaiord:name="30">
      <textevent timeoffset="10" message="1"/>
    </SteadyState>
  </workout>
</workout_file>`;

      // Act
      const krd = await reader(xml);

      // Assert
      const workout = workoutOf(krd);
      const zwift = krd.extensions?.zwift as Record<string, unknown>;
      const step = workout.steps[0] as WorkoutStep;
      expect(workout.name).toBe("42");
      expect(zwift.author).toBe("7");
      expect(zwift.description).toBe("3");
      expect(step.name).toBe("30");
      expect(step.notes).toBe("1");
      expect(textEventsOf(step)).toStrictEqual([
        { message: "1", timeoffset: 10 },
      ]);
      expect(step.duration).toStrictEqual({ type: "time", seconds: 300 });
      expect(step.target).toStrictEqual({
        type: "power",
        value: { unit: "percent_ftp", value: 80 },
      });
    }
  );

  it(
    "should keep the text events of both sides of an IntervalsT",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const onEvents = [{ message: "Go", timeoffset: 0 }];
      const offEvents = [
        { message: "Spin easy", timeoffset: 0 },
        { message: "Get ready", timeoffset: 20 },
      ];
      const krd = repeatStepsWith(({ on, off }) => ({
        on: withTextEvents(on, onEvents),
        off: withTextEvents(off, offEvents),
      }));

      // Act
      const xml = await writer(krd);
      const steps = stepsOf(await reader(xml));

      // Assert
      // Off events are timed from the start of the pair, so native Zwift
      // shows them after the on-step (OnDuration = 500).
      expect(xml).toContain('message="Spin easy" timeoffset="500"');
      expect(xml).toContain('message="Get ready" timeoffset="520"');
      expect(textEventsOf(steps.on)).toStrictEqual(onEvents);
      expect(steps.on.notes).toBe("Go");
      expect(textEventsOf(steps.off)).toStrictEqual(offEvents);
      expect(steps.off.notes).toBe("Spin easy");
    }
  );

  it(
    "should keep IntervalsT text events next to a cadence on the same side",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const onEvents = [{ message: "Spin up", timeoffset: 0 }];
      const offEvents = [{ message: "Ease off", timeoffset: 5 }];
      const krd = repeatStepsWith(({ on, off }) => ({
        on: {
          ...on,
          extensions: { zwift: { cadence: 95, textEvents: onEvents } },
        },
        off: {
          ...off,
          extensions: { zwift: { cadence: 80, textEvents: offEvents } },
        },
      }));

      // Act
      const steps = stepsOf(await reader(await writer(krd)));

      // Assert
      expect(steps.on.extensions?.zwift).toStrictEqual({
        cadence: 95,
        textEvents: onEvents,
      });
      expect(steps.off.extensions?.zwift).toStrictEqual({
        cadence: 80,
        textEvents: offEvents,
      });
    }
  );

  it(
    "should keep text events identical across two ZWO passes",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const krd = repeatStepsWith(({ first, on, off }) => ({
        first: withTextEvents(first, [
          { message: "Warm up", timeoffset: 0 },
          { message: "Pick it up", timeoffset: 30 },
        ]),
        on: withTextEvents(on, [{ message: "Go", timeoffset: 0 }]),
        off: withTextEvents(off, [{ message: "Recover", timeoffset: 10 }]),
      }));

      // Act
      const zwo1 = await writer(krd);
      const krd1 = await reader(zwo1);
      const zwo2 = await writer(krd1);
      const krd2 = await reader(zwo2);

      // Assert
      const textOf = (k: KRD) => {
        const steps = stepsOf(k);
        return [steps.first, steps.on, steps.off].map((step) => ({
          notes: step.notes,
          textEvents: textEventsOf(step),
        }));
      };
      const original = textOf(krd);
      expect(textOf(krd1)).toStrictEqual(original);
      expect(textOf(krd2)).toStrictEqual(original);
      expect(zwo2).toBe(zwo1);
    }
  );
});
