/**
 * The first read of every FIT workout fixture: each field the Garmin FIT SDK
 * Decoder finds in the file must be in the KRD the FIT reader makes of it,
 * or be declared below as a field KRD does not carry.
 */
import { Decoder, Stream } from "@garmin/fitsdk";
import type { SourceField } from "@kaiord/core/test-utils";
import {
  createMockLogger,
  firstReadReport,
  FIXTURE_NAMES,
  loadFitFixture,
  sourceValuesOf,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createGarminFitSdkReader } from "../garmin-fitsdk";

type Rec = Record<string, unknown>;

const STEP = "workoutStepMesgs";
const KRD_W = "extensions.structured_workout";
const KRD_STEP = `${KRD_W}.**.steps.*`;
/** FIT holds a custom heart rate over 100 as bpm + 100, and power over 1000 as W + 1000. */
const HR_OFFSET = 100;
const POWER_OFFSET = 1000;

const DURATIONS: Rec = {
  time: "time",
  distance: "distance",
  hrLessThan: "heart_rate_less_than",
  repeatUntilHrGreaterThan: "repeat_until_heart_rate_greater_than",
};
const TARGETS: Rec = { heartRate: "heart_rate", power: "power", open: "open" };
const DURATION_FIELD: Rec = {
  time: "durationTime",
  distance: "durationDistance",
  hrLessThan: "durationHr",
};

const kind = (c: Rec) => String(c.durationType);
const isBlock = (c: Rec) => kind(c) === "repeatUntilStepsCmplt";
const isRepeat = (c: Rec) => kind(c).startsWith("repeat");
const isCustom = (c: Rec) => c.customTargetValueLow !== undefined;
const shareOfMax = (c: Rec) => Number(c.customTargetHeartRateLow) <= HR_OFFSET;

/** Every field the FIT workout fixtures hold, and what the first read makes of it. */
const FIT_SOURCE_FIELDS: ReadonlyArray<SourceField> = [
  {
    source: "fileIdMesgs.type",
    krd: ["type"],
    as: (v) => (v === "workout" ? "structured_workout" : v),
  },
  { source: "fileIdMesgs.manufacturer", krd: ["metadata.manufacturer"] },
  { source: "fileIdMesgs.garminProduct", krd: ["metadata.product"] },
  {
    source: "fileIdMesgs.product",
    sameAs: "garminProduct",
    reason: "the product number, read as its Garmin name",
  },
  {
    source: "fileIdMesgs.serialNumber",
    krd: ["metadata.serialNumber"],
    as: String,
  },
  { source: "fileIdMesgs.timeCreated", krd: ["metadata.created"] },
  { source: "workoutMesgs.wktName", krd: [`${KRD_W}.name`] },
  {
    source: "workoutMesgs.numValidSteps",
    notCarried: "the number of steps, which KRD holds as its list",
  },
  {
    source: `${STEP}.wktStepName`,
    when: isBlock,
    notCarried: "the name of a repeat step: a KRD repeat block has no name",
  },
  {
    source: `${STEP}.*`,
    when: isBlock,
    notCarried:
      "a repeat-the-steps step is read as a KRD repeat block; its index, duration and target fields hold the block",
  },
  { source: `${STEP}.messageIndex`, krd: [`${KRD_STEP}.stepIndex`] },
  { source: `${STEP}.wktStepName`, krd: [`${KRD_STEP}.name`] },
  { source: `${STEP}.intensity`, krd: [`${KRD_STEP}.intensity`] },
  {
    source: `${STEP}.durationType`,
    krd: [`${KRD_STEP}.duration.type`],
    as: (v) => DURATIONS[String(v)],
  },
  ...Object.entries(DURATION_FIELD).map(([type, field]) => ({
    source: `${STEP}.durationValue`,
    when: (c: Rec) => kind(c) === type,
    sameAs: String(field),
    reason: "the raw duration, read through its sub-field",
  })),
  { source: `${STEP}.durationTime`, krd: [`${KRD_STEP}.duration.seconds`] },
  { source: `${STEP}.durationDistance`, krd: [`${KRD_STEP}.duration.meters`] },
  {
    source: `${STEP}.durationHr`,
    krd: [`${KRD_STEP}.duration.bpm`],
    as: (v) => Number(v) - HR_OFFSET,
  },
  {
    source: `${STEP}.durationStep`,
    krd: [`${KRD_STEP}.duration.repeatFrom`],
  },
  {
    source: `${STEP}.durationValue`,
    when: isRepeat,
    sameAs: "durationStep",
    reason: "the raw step a repeat goes back to",
  },
  { source: `${STEP}.repeatHr`, krd: [`${KRD_STEP}.duration.bpm`] },
  {
    source: `${STEP}.*`,
    when: isRepeat,
    notCarried:
      "a repeat-until step's target fields hold its repeat value, read as its duration",
  },
  {
    source: `${STEP}.targetType`,
    krd: [`${KRD_STEP}.target.type`],
    as: (v) => TARGETS[String(v)],
  },
  {
    source: `${STEP}.*`,
    when: (c) => isCustom(c) && c.targetType === "heartRate" && shareOfMax(c),
    notCarried:
      "a heart-rate range as a share of maximum (custom values up to 100): a KRD heart-rate range is in bpm, so the reader reads the shares as bpm",
  },
  ...["targetValue", "targetPowerZone"].map((f) => ({
    source: `${STEP}.${f}`,
    when: isCustom,
    notCarried: "zone 0: the step uses its custom range",
  })),
  ...["customTargetValueLow", "customTargetValueHigh"].map((f) => ({
    source: `${STEP}.${f}`,
    notCarried: "the raw custom range, read through its sub-fields",
  })),
  {
    source: `${STEP}.targetValue`,
    when: (c) => c.targetType === "heartRate",
    sameAs: "targetHrZone",
    reason: "the raw zone, read through its sub-field",
  },
  {
    source: `${STEP}.targetValue`,
    when: (c) => c.targetType === "power",
    sameAs: "targetPowerZone",
    reason: "the raw zone, read through its sub-field",
  },
  { source: `${STEP}.targetHrZone`, krd: [`${KRD_STEP}.target.value.value`] },
  {
    source: `${STEP}.targetPowerZone`,
    krd: [`${KRD_STEP}.target.value.value`],
  },
  {
    source: `${STEP}.customTargetPowerLow`,
    krd: [`${KRD_STEP}.target.value.min`],
    as: (v) => Number(v) - POWER_OFFSET,
  },
  {
    source: `${STEP}.customTargetPowerHigh`,
    krd: [`${KRD_STEP}.target.value.max`],
    as: (v) => Number(v) - POWER_OFFSET,
  },
];

const decode = (data: Uint8Array): Rec => {
  const { messages } = new Decoder(Stream.fromByteArray([...data])).read();
  return JSON.parse(JSON.stringify(messages)) as Rec;
};
const read = createGarminFitSdkReader(createMockLogger());

describe("First read: FIT", () => {
  it("should read every value of every FIT workout fixture that KRD can hold", async () => {
    // Arrange
    const fixtures = await Promise.all(
      Object.values(FIXTURE_NAMES).map(async (name) => {
        const data = loadFitFixture(`${name}.fit`);
        const values = sourceValuesOf(decode(data));
        return { name, values, krd: await read(data) };
      })
    );

    // Act
    const report = firstReadReport(FIT_SOURCE_FIELDS, fixtures);

    // Assert
    expect(report.problems).toEqual([]);
    expect(report.unused).toEqual([]);
  });
});
