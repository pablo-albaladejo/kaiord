/**
 * The first read of every TCX workout fixture: each value the file holds,
 * listed by an XML parse of its own, must be in the KRD the TCX reader makes
 * of it, or be declared below as a field KRD does not carry.
 */
import type { SourceField } from "@kaiord/core/test-utils";
import {
  createMockLogger,
  firstReadReport,
  loadTcxFixture,
  sourceValuesOf,
} from "@kaiord/core/test-utils";
import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";

import { createFastXmlTcxReader } from "../fast-xml-parser";

const W = "TrainingCenterDatabase.Workouts.Workout";
const STEP = `${W}.Step`;
const KRD_W = "extensions.structured_workout";
const KRD_STEP = `${KRD_W}.**.steps.*`;

const SPORTS: Record<string, string> = {
  Running: "running",
  Biking: "cycling",
  Other: "generic",
};
const INTENSITIES: Record<string, string> = {
  Active: "active",
  Resting: "rest",
};
const DURATIONS: Record<string, string> = {
  Time_t: "time",
  Distance_t: "distance",
  UserInitiated_t: "open",
  CaloriesBurned_t: "calories",
  HeartRateBelow_t: "heart_rate_less_than",
};
const TARGETS: Record<string, string> = {
  HeartRate_t: "heart_rate",
  Speed_t: "pace",
  Cadence_t: "cadence",
  None_t: "open",
};
const NO_HR_ABOVE = (
  _: unknown,
  ancestors: ReadonlyArray<Record<string, unknown>>
) =>
  ancestors.some(
    (a) =>
      (a.Duration as Record<string, unknown> | undefined)?.["@_xsi:type"] ===
      "HeartRateAbove_t"
  );
const HR_ABOVE_REASON =
  "KRD has no step that ends when heart rate rises above a value, so the reader skips that step and warns";

/** Every field the TCX workout fixtures hold, and what the first read makes of it. */
const TCX_SOURCE_FIELDS: ReadonlyArray<SourceField> = [
  { source: "?xml.**", notCarried: "the XML declaration" },
  {
    source: "TrainingCenterDatabase.*",
    notCarried: "XML namespace declarations",
  },
  {
    source: `${W}.@_Sport`,
    krd: [`${KRD_W}.sport`],
    as: (v) => SPORTS[String(v)],
  },
  { source: `${W}.Name`, krd: [`${KRD_W}.name`] },
  { source: `${STEP}.**`, when: NO_HR_ABOVE, notCarried: HR_ABOVE_REASON },
  {
    source: `${STEP}.@_xsi:type`,
    notCarried:
      "Step_t or Repeat_t: KRD tells a step from a repeat block by its shape",
  },
  {
    source: `${STEP}.StepId`,
    notCarried: "KRD numbers steps by their order in the list",
  },
  { source: `${STEP}.Name`, krd: [`${KRD_STEP}.name`] },
  {
    source: `${STEP}.Intensity`,
    krd: [`${KRD_STEP}.intensity`],
    as: (v) => INTENSITIES[String(v)],
  },
  {
    source: `${STEP}.Repetitions`,
    krd: [`${KRD_W}.steps.*.repeatCount`],
  },
  {
    source: `${STEP}.Duration.@_xsi:type`,
    krd: [`${KRD_STEP}.duration.type`],
    as: (v) => DURATIONS[String(v)],
  },
  { source: `${STEP}.Duration.Seconds`, krd: [`${KRD_STEP}.duration.seconds`] },
  { source: `${STEP}.Duration.Meters`, krd: [`${KRD_STEP}.duration.meters`] },
  {
    source: `${STEP}.Duration.Calories`,
    krd: [`${KRD_STEP}.duration.calories`],
  },
  {
    source: `${STEP}.Duration.HeartRate.@_xsi:type`,
    sameAs: "Value",
    reason: "the unit of the heart-rate value, read with it",
  },
  {
    source: `${STEP}.Duration.HeartRate.Value`,
    krd: [`${KRD_STEP}.duration.bpm`],
  },
  {
    source: `${STEP}.Target.@_xsi:type`,
    krd: [`${KRD_STEP}.target.type`],
    as: (v) => TARGETS[String(v)],
  },
  {
    source: `${STEP}.Target.*.@_xsi:type`,
    notCarried:
      "the kind of zone (predefined or custom), which KRD reads from the zone number or the range",
  },
  {
    source: `${STEP}.Target.*.Number`,
    krd: [`${KRD_STEP}.target.value.value`],
  },
  {
    source: `${STEP}.Target.SpeedZone.ViewAs`,
    notCarried: "whether a device shows the speed as pace or speed",
  },
  {
    source: `${STEP}.Target.SpeedZone.LowInMetersPerSecond`,
    krd: [`${KRD_STEP}.target.value.min`],
  },
  {
    source: `${STEP}.Target.SpeedZone.HighInMetersPerSecond`,
    krd: [`${KRD_STEP}.target.value.max`],
  },
  {
    source: `${STEP}.Target.HeartRateZone.*.@_xsi:type`,
    sameAs: "Value",
    reason: "the unit of a heart-rate bound, read with it",
  },
  {
    source: `${STEP}.Target.HeartRateZone.Low.Value`,
    krd: [`${KRD_STEP}.target.value.min`],
  },
  {
    source: `${STEP}.Target.HeartRateZone.High.Value`,
    krd: [`${KRD_STEP}.target.value.max`],
  },
  {
    source: `${STEP}.Target.Low`,
    krd: [`${KRD_STEP}.target.value.min`],
    as: (v) => Number(v) / 2,
    reason: "running cadence: TCX counts steps per minute, KRD revolutions",
  },
  {
    source: `${STEP}.Target.High`,
    krd: [`${KRD_STEP}.target.value.max`],
    as: (v) => Number(v) / 2,
    reason: "running cadence: TCX counts steps per minute, KRD revolutions",
  },
];

const FIXTURES = [
  "WorkoutHeartRateTargets.tcx",
  "WorkoutMixedDurations.tcx",
  "WorkoutRepeatBlocks.tcx",
  "WorkoutSpeedTargets.tcx",
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
});
const read = createFastXmlTcxReader(createMockLogger());

describe("Round-trip first read: TCX", () => {
  it("should read every value of every TCX workout fixture that KRD can hold", async () => {
    // Arrange
    const fixtures = await Promise.all(
      FIXTURES.map(async (name) => {
        const text = loadTcxFixture(name);
        const values = sourceValuesOf(parser.parse(text)).map((v) => ({
          ...v,
          field: v.field.replace(".Step.Child.", ".Step."),
        }));
        return { name, values, krd: await read(text) };
      })
    );

    // Act
    const report = firstReadReport(TCX_SOURCE_FIELDS, fixtures);

    // Assert
    expect(report.problems).toEqual([]);
    expect(report.unused).toEqual([]);
  });
});
