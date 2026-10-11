import type { Logger, RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { extractWorkout } from "@kaiord/core";
import { loadTcxFixture } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "../fast-xml-parser";
import { createXsdTcxValidator } from "../xsd-validator";

const FIXTURE = "WorkoutRepeatBlocks.tcx";
// WorkoutRepeatBlocks.tcx: warm-up, a 5x block (zone 4 work, zone 2 rest),
// cool-down.
const TOP_LEVEL_ENTRIES = 3;
const REPEAT_COUNT = 5;
const WORK_ZONE = 4;
const REST_ZONE = 2;

const createPipeline = () => {
  const logger: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  return {
    logger,
    reader: createFastXmlTcxReader(logger),
    writer: createFastXmlTcxWriter(logger, createXsdTcxValidator(logger)),
  };
};

const hrZone = (value: number) => ({
  type: "heart_rate",
  value: { unit: "zone", value },
});

describe("TCX repetition blocks (WorkoutRepeatBlocks.tcx)", () => {
  it("should read the Repeat_t as a repetition block with its child steps", async () => {
    // Arrange
    const { logger, reader } = createPipeline();
    const xml = loadTcxFixture(FIXTURE);

    // Act
    const steps = extractWorkout(await reader(xml)).steps;

    // Assert
    expect(steps).toHaveLength(TOP_LEVEL_ENTRIES);
    const [warmup, block, cooldown] = steps as [
      WorkoutStep,
      RepetitionBlock,
      WorkoutStep,
    ];
    expect(warmup).toMatchObject({
      name: "Warmup",
      duration: { type: "time", seconds: 600 },
      target: { type: "open" },
      intensity: "active",
    });
    expect(block.repeatCount).toBe(REPEAT_COUNT);
    expect(block.steps).toHaveLength(2);
    expect(block.steps[0]).toMatchObject({
      stepIndex: 1,
      name: "Work",
      duration: { type: "time", seconds: 240 },
      target: hrZone(WORK_ZONE),
      intensity: "active",
    });
    expect(block.steps[1]).toMatchObject({
      stepIndex: 2,
      name: "Rest",
      duration: { type: "time", seconds: 120 },
      target: hrZone(REST_ZONE),
      intensity: "rest",
    });
    expect(cooldown).toMatchObject({
      stepIndex: 3,
      name: "Cooldown",
      duration: { type: "time", seconds: 300 },
      intensity: "rest",
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should write the repetition block back as a Repeat_t with every Child", async () => {
    // Arrange
    const { reader, writer } = createPipeline();
    const krd = await reader(loadTcxFixture(FIXTURE));

    // Act
    const xml = await writer(krd);

    // Assert
    expect(xml).toContain('xsi:type="Repeat_t"');
    expect(xml).toContain("<Repetitions>5</Repetitions>");
    expect(xml.match(/<Child xsi:type="Step_t">/g)).toHaveLength(2);
  });

  it("should keep every step identical through TCX → KRD → TCX → KRD", async () => {
    // Arrange
    const { reader, writer } = createPipeline();
    const krd1 = await reader(loadTcxFixture(FIXTURE));

    // Act
    const krd2 = await reader(await writer(krd1));

    // Assert
    expect(extractWorkout(krd2).steps).toStrictEqual(
      extractWorkout(krd1).steps
    );
  });
});
