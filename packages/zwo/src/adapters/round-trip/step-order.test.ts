/* eslint-disable no-magic-numbers -- durations, zones and repeat counts are literal fixture values */
import type { KRD, Logger, RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

type StepNode = WorkoutStep | RepetitionBlock;

const mockLogger = createMockLogger();
const validator = createXsdZwiftValidator(mockLogger);

const createSpyLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const stepsOf = (krd: KRD): Array<StepNode> =>
  (krd.extensions?.structured_workout as { steps: Array<StepNode> }).steps;

const workoutElementNames = (xml: string): Array<string> => {
  const workout = xml.slice(
    xml.indexOf("<workout>"),
    xml.indexOf("</workout>")
  );
  return [...workout.matchAll(/<(\w+)[\s>]/g)]
    .map((match) => match[1]!)
    .filter((name) => name !== "workout" && name !== "textevent");
};

const timeStep = (
  stepIndex: number,
  seconds: number,
  target: WorkoutStep["target"] = {
    type: "power",
    value: { unit: "percent_ftp", value: 60 },
  }
): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds },
  targetType: target.type,
  target,
  intensity: "active",
});

const makeKrd = (steps: Array<StepNode>): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Order", sport: "cycling", steps },
  },
});

const MIXED_ZWO = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Mixed</name>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.4" PowerHigh="0.7"/>
    <SteadyState Duration="300" Power="0.8"/>
    <IntervalsT Repeat="4" OnDuration="30" OffDuration="90" OnPower="1.2" OffPower="0.5"/>
    <SteadyState Duration="120" Power="0.75"/>
    <Cooldown Duration="400" PowerLow="0.6" PowerHigh="0.3"/>
  </workout>
</workout_file>`;

describe("ZWO step order", () => {
  it("should read intervals in document order, not grouped by element type", async () => {
    // Arrange
    const reader = createFastXmlZwiftReader(mockLogger, validator);

    // Act
    const steps = stepsOf(await reader(MIXED_ZWO));

    // Assert
    const shape = steps.map((node) =>
      "repeatCount" in node
        ? `repeat x${node.repeatCount}`
        : `${node.intensity} ${(node.duration as { seconds: number }).seconds}`
    );
    expect(shape).toStrictEqual([
      "warmup 600",
      "active 300",
      "repeat x4",
      "active 120",
      "cooldown 400",
    ]);
  });

  it("should write intervals in KRD step order", async () => {
    // Arrange
    const writer = createFastXmlZwiftWriter(mockLogger, validator);
    const krd = makeKrd([
      timeStep(0, 600),
      {
        repeatCount: 3,
        steps: [timeStep(1, 30), timeStep(2, 90)],
      },
      timeStep(3, 120),
      timeStep(4, 300, { type: "open" }),
    ]);

    // Act
    const xml = await writer(krd);

    // Assert
    expect(workoutElementNames(xml)).toStrictEqual([
      "SteadyState",
      "IntervalsT",
      "SteadyState",
      "FreeRide",
    ]);
  });

  it("should keep the order of a native ZWO through ZWO → KRD → ZWO", async () => {
    // Arrange
    const reader = createFastXmlZwiftReader(mockLogger, validator);
    const writer = createFastXmlZwiftWriter(mockLogger, validator);

    // Act
    const xml = await writer(await reader(MIXED_ZWO));

    // Assert
    expect(workoutElementNames(xml)).toStrictEqual([
      "Warmup",
      "SteadyState",
      "IntervalsT",
      "SteadyState",
      "Cooldown",
    ]);
  });
});

describe("ZWO repetition blocks Zwift cannot express as IntervalsT", () => {
  it("should unroll a three-step repetition block in place and warn", async () => {
    // Arrange
    const logger = createSpyLogger();
    const writer = createFastXmlZwiftWriter(logger, validator);
    const krd = makeKrd([
      timeStep(0, 600),
      {
        repeatCount: 2,
        steps: [timeStep(1, 10), timeStep(2, 20), timeStep(3, 30)],
      },
      timeStep(4, 400),
    ]);

    // Act
    const xml = await writer(krd);

    // Assert
    const durations = [...xml.matchAll(/ Duration="(\d+)"/g)].map((m) =>
      Number(m[1])
    );
    expect(durations).toStrictEqual([600, 10, 20, 30, 10, 20, 30, 400]);
    expect(logger.warn).toHaveBeenCalledWith(
      "Lossy conversion: repetition block unrolled, Zwift IntervalsT only supports constant on/off pairs",
      { repeatCount: 2, stepCount: 3 }
    );
  });
});

describe("ZWO IntervalsT step fidelity", () => {
  it("should keep power-zone targets, names, intensities and distance durations inside an IntervalsT", async () => {
    // Arrange
    const writer = createFastXmlZwiftWriter(mockLogger, validator);
    const reader = createFastXmlZwiftReader(mockLogger, validator);
    const onStep: WorkoutStep = {
      stepIndex: 0,
      name: "B1_",
      durationType: "distance",
      duration: { type: "distance", meters: 500 },
      targetType: "power",
      target: { type: "power", value: { unit: "zone", value: 5 } },
      intensity: "active",
    };
    const offStep: WorkoutStep = {
      ...onStep,
      stepIndex: 1,
      name: "B2_",
      target: { type: "power", value: { unit: "zone", value: 3 } },
    };
    const krd = makeKrd([{ repeatCount: 3, steps: [onStep, offStep] }]);

    // Act
    const xml = await writer(krd);
    const [block] = stepsOf(await reader(xml)) as Array<RepetitionBlock>;

    // Assert
    expect(xml).toMatch(/OnPower="1\.2"/);
    expect(xml).toMatch(/OffPower="0\.9"/);
    expect(block!.repeatCount).toBe(3);
    expect(block!.steps).toStrictEqual([
      { ...onStep, stepIndex: 0 },
      { ...offStep, stepIndex: 1 },
    ]);
  });
});

describe("ZWO FreeRide XSD conformance", () => {
  it("should write an open-target step carrying kaiord round-trip attributes as valid ZWO", async () => {
    // Arrange
    const writer = createFastXmlZwiftWriter(mockLogger, validator);
    const reader = createFastXmlZwiftReader(mockLogger, validator);
    const step: WorkoutStep = {
      ...timeStep(0, 300, { type: "open" }),
      name: "Easy",
      intensity: "rest",
    };

    // Act
    const [readBack] = stepsOf(await reader(await writer(makeKrd([step]))));

    // Assert
    expect(readBack).toStrictEqual(step);
  });
});
