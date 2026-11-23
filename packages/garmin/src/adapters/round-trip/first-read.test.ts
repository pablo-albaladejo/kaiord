/**
 * The first read of every GCN workout fixture: each value the JSON holds
 * must be in the KRD the Garmin Connect reader makes of it, or be declared
 * below as a field KRD does not carry.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { SourceField } from "@kaiord/core/test-utils";
import {
  createMockLogger,
  firstReadReport,
  sourceValuesOf,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createGarminReader } from "../garmin-reader";

type Rec = Record<string, unknown>;

const SEGMENT = "workoutSegments";
const STEP = `${SEGMENT}.workoutSteps`;
const KRD_W = "extensions.structured_workout";
const KRD_STEP = `${KRD_W}.**.steps.*`;
const NAME_MAX = 255;

const SPORTS: Rec = {
  running: "running",
  cycling: "cycling",
  swimming: "swimming",
};
const INTENSITIES: Rec = {
  warmup: "warmup",
  cooldown: "cooldown",
  interval: "active",
  recovery: "recovery",
  rest: "rest",
};
const DURATIONS: Rec = {
  time: "time",
  distance: "distance",
  calories: "calories",
  "lap.button": "open",
};
const TARGETS: Rec = {
  "power.zone": "power",
  "heart.rate.zone": "heart_rate",
  "pace.zone": "pace",
  "speed.zone": "pace",
  cadence: "cadence",
  "cadence.zone": "cadence",
  "no.target": "open",
};
const STROKES: Rec = {
  backstroke: 1,
  breaststroke: 2,
  fly: 3,
  drill: 4,
  mixed: 5,
};
/** Garmin stroke ids (the writer's table) as KRD swim-stroke values. */
const STROKE_IDS: Rec = { 2: 1, 3: 2, 4: 4, 5: 3, 6: 0, 7: 5, 8: 5 };
const EQUIPMENT_IDS: Rec = {
  1: "swim_fins",
  2: "swim_kickboard",
  3: "swim_paddles",
  4: "swim_pull_buoy",
  5: "swim_snorkel",
};
const EQUIPMENT: Rec = {
  fins: "swim_fins",
  kickboard: "swim_kickboard",
  paddles: "swim_paddles",
  pull_buoy: "swim_pull_buoy",
};

const stepOf = (ancestors: ReadonlyArray<Rec>): Rec =>
  [...ancestors].reverse().find((a) => "stepOrder" in a) ?? {};
const endOf = (_: Rec, ancestors: ReadonlyArray<Rec>) =>
  (stepOf(ancestors).endCondition as Rec | undefined)?.conditionTypeKey;
const endIs =
  (...keys: Array<string>) =>
  (c: Rec, a: ReadonlyArray<Rec>) =>
    keys.includes(String(endOf(c, a)));
const isRepeat = (_: Rec, a: ReadonlyArray<Rec>) =>
  stepOf(a).type === "RepeatGroupDTO";
const isNested = (_: Rec, a: ReadonlyArray<Rec>) =>
  a.filter((r) => "stepOrder" in r).length > 2 ||
  (isRepeat(_, a) && a.filter((r) => "stepOrder" in r).length > 1);
const primaryHeld = (_: Rec, a: ReadonlyArray<Rec>) =>
  (stepOf(a).targetType as Rec | undefined)?.workoutTargetTypeKey !==
  "no.target";
const hasStroke = (_: Rec, a: ReadonlyArray<Rec>) => {
  const stroke = stepOf(a).strokeType as Rec | undefined;
  return (
    stroke !== undefined &&
    stroke.strokeTypeId !== 0 &&
    stroke.strokeTypeKey !== "any_stroke"
  );
};

const GARMIN_ONLY =
  "Garmin Connect account and catalogue data (ids, owner, estimates, sharing, thumbnail)";

/** Every field the GCN workout fixtures hold, and what the first read makes of it. */
const GCN_SOURCE_FIELDS: ReadonlyArray<SourceField> = [
  {
    source: "workoutName",
    krd: [`${KRD_W}.name`],
    as: (v) => String(v).slice(0, NAME_MAX),
    reason: `a name over ${NAME_MAX} characters is cut to ${NAME_MAX}, the Garmin Connect limit`,
  },
  {
    source: "sportType.sportTypeKey",
    when: (c) => SPORTS[String(c.sportTypeKey)] === undefined,
    notCarried:
      "a strength, cardio or multisport Garmin Connect workout is read as a generic workout",
  },
  {
    source: "sportType.sportTypeKey",
    krd: [`${KRD_W}.sport`],
    as: (v) => SPORTS[String(v)],
  },
  {
    source: "sportType.*",
    sameAs: "sportTypeKey",
    reason: "the id and display order of the sport, read with its key",
  },
  {
    source: "createdDate",
    krd: ["metadata.created"],
    as: (v) => new Date(`${String(v)}Z`).toISOString(),
  },
  {
    source: "updatedDate",
    notCarried: "KRD keeps when a workout was created, not when it changed",
  },
  {
    source: "isSessionTransitionEnabled",
    krd: ["extensions.gcn.isSessionTransitionEnabled"],
  },
  { source: "poolLength", krd: [`${KRD_W}.poolLength`] },
  {
    source: "poolLengthUnit.unitKey",
    krd: [`${KRD_W}.poolLengthUnit`],
    as: (v) => (v === "meter" ? "meters" : v),
  },
  {
    source: "poolLengthUnit.*",
    sameAs: "unitKey",
    reason: "the id and factor of the unit, read with its key",
  },
  ...[
    "workoutId",
    "ownerId",
    "author.*",
    "shared",
    "workoutThumbnailUrl",
    "avgTrainingSpeed",
    "estimatedDurationInSecs",
    "estimatedDistanceInMeters",
    "isWheelchair",
  ].map((source) => ({ source, notCarried: GARMIN_ONLY })),
  {
    source: `${SEGMENT}.segmentOrder`,
    notCarried: "KRD reads the segments in their order, as one list of steps",
  },
  {
    source: `${SEGMENT}.sportType.*`,
    notCarried:
      "KRD has one sport per workout: a segment's sport is the workout's, and a multisport workout's segments are read as one generic workout",
  },
  ...["poolLength", "poolLengthUnit.*"].map((f) => ({
    source: `${SEGMENT}.${f}`,
    notCarried: "the segment's pool, the same as the workout's pool length",
  })),
  ...[
    "avgTrainingSpeed",
    "estimateType",
    "estimatedDistanceInMeters",
    "estimatedDurationInSecs",
    "estimatedDistanceUnit.*",
  ].map((f) => ({ source: `${SEGMENT}.${f}`, notCarried: GARMIN_ONLY })),
  {
    source: `${STEP}.**`,
    when: isNested,
    notCarried:
      "a repeat inside a repeat: KRD repeat blocks do not nest, so the inner repeat's steps are read once in the outer block and its count is lost",
  },
  ...["stepId", "stepOrder", "childStepId", "type"].map((f) => ({
    source: `${STEP}.${f}`,
    notCarried:
      "Garmin Connect's step ids and kind; KRD orders steps by the list and tells a block by its shape",
  })),
  {
    source: `${STEP}.numberOfIterations`,
    krd: [`${KRD_W}.steps.*.repeatCount`],
  },
  {
    source: `${STEP}.smartRepeat`,
    notCarried: "KRD has no smart repeat (repeat until the athlete stops it)",
  },
  {
    source: `${STEP}.stepType.*`,
    when: isRepeat,
    notCarried: "the repeat step kind; KRD tells a block by its shape",
  },
  {
    source: `${STEP}.endCondition.*`,
    when: isRepeat,
    notCarried: "a repeat's iterations, read as its repeat count",
  },
  {
    source: `${STEP}.endConditionValue`,
    when: isRepeat,
    sameAs: "numberOfIterations",
    reason: "a repeat's iterations",
  },
  {
    source: `${STEP}.stepType.stepTypeKey`,
    krd: [`${KRD_STEP}.intensity`],
    as: (v) => INTENSITIES[String(v)],
  },
  {
    source: `${STEP}.stepType.*`,
    sameAs: "stepTypeKey",
    reason: "the id and display order of the step type",
  },
  {
    source: `${STEP}.**`,
    when: endIs("reps"),
    notCarried:
      "KRD has no step that ends after a number of repetitions; the reader reads it as a lap-button step",
  },
  {
    source: `${STEP}.endCondition.conditionTypeKey`,
    krd: [`${KRD_STEP}.duration.type`],
    as: (v) => DURATIONS[String(v)],
  },
  {
    source: `${STEP}.endCondition.*`,
    sameAs: "conditionTypeKey",
    reason: "the id, display order and display flag of the end",
  },
  {
    source: `${STEP}.endConditionValue`,
    when: endIs("time"),
    krd: [`${KRD_STEP}.duration.seconds`],
  },
  {
    source: `${STEP}.endConditionValue`,
    when: endIs("distance"),
    krd: [`${KRD_STEP}.duration.meters`],
  },
  {
    source: `${STEP}.endConditionValue`,
    when: endIs("calories"),
    krd: [`${KRD_STEP}.duration.calories`],
  },
  {
    source: `${STEP}.endConditionValue`,
    when: endIs("lap.button"),
    notCarried: "a lap-button step has no value",
  },
  {
    source: `${STEP}.preferredEndConditionUnit.*`,
    notCarried: "the unit Garmin Connect shows a distance in",
  },
  {
    source: `${STEP}.targetType.workoutTargetTypeKey`,
    when: hasStroke,
    notCarried: "a swim step's target is its stroke in KRD",
  },
  {
    source: `${STEP}.targetType.workoutTargetTypeKey`,
    krd: [`${KRD_STEP}.target.type`],
    as: (v) => TARGETS[String(v)],
  },
  {
    source: `${STEP}.targetType.*`,
    sameAs: "workoutTargetTypeKey",
    reason: "the id and display order of the target type",
  },
  { source: `${STEP}.zoneNumber`, krd: [`${KRD_STEP}.target.value.value`] },
  { source: `${STEP}.targetValueOne`, krd: [`${KRD_STEP}.target.value.min`] },
  { source: `${STEP}.targetValueTwo`, krd: [`${KRD_STEP}.target.value.max`] },
  ...[
    "secondaryTargetType.*",
    "secondaryTargetValueOne",
    "secondaryTargetValueTwo",
  ].map((f) => ({
    source: `${STEP}.${f}`,
    when: primaryHeld,
    notCarried:
      "a KRD step has one target: a second target is read only when the step has no first one",
  })),
  {
    source: `${STEP}.strokeType.strokeTypeId`,
    when: (c) => !("strokeTypeKey" in c) && c.strokeTypeId !== 1,
    krd: [`${KRD_STEP}.target.value.value`],
    as: (v) => STROKE_IDS[Number(v)],
  },
  {
    source: `${STEP}.strokeType.strokeTypeId`,
    when: (c) => !("strokeTypeKey" in c),
    notCarried: "any stroke (Garmin id 1): KRD has no stroke target for it",
  },
  {
    source: `${STEP}.equipmentType.equipmentTypeId`,
    when: (c) => !("equipmentTypeKey" in c),
    krd: [`${KRD_STEP}.equipment`],
    as: (v) => EQUIPMENT_IDS[Number(v)],
  },
  {
    source: `${STEP}.strokeType.strokeTypeKey`,
    when: (c) => c.strokeTypeId === 0 || c.strokeTypeKey === "any_stroke",
    notCarried: "any stroke: KRD has no stroke target for it",
  },
  {
    source: `${STEP}.strokeType.strokeTypeKey`,
    krd: [`${KRD_STEP}.target.value.value`],
    as: (v) => STROKES[String(v)],
  },
  {
    source: `${STEP}.strokeType.*`,
    sameAs: "strokeTypeKey",
    reason: "the id and display order of the stroke",
  },
  {
    source: `${STEP}.equipmentType.*`,
    when: (c) => c.equipmentTypeId === 0,
    notCarried: "no equipment",
  },
  {
    source: `${STEP}.equipmentType.equipmentTypeKey`,
    krd: [`${KRD_STEP}.equipment`],
    as: (v) => EQUIPMENT[String(v)],
  },
  {
    source: `${STEP}.equipmentType.*`,
    sameAs: "equipmentTypeKey",
    reason: "the id and display order of the equipment",
  },
];

const fixturesDir = join(__dirname, "../../../../../test-fixtures/gcn");
const read = createGarminReader(createMockLogger());

describe("Round-trip first read: GCN", () => {
  it("should read every value of every GCN workout fixture that KRD can hold", async () => {
    // Arrange
    const fixtures = await Promise.all(
      readdirSync(fixturesDir).map(async (name) => {
        const text = readFileSync(join(fixturesDir, name), "utf-8");
        const values = sourceValuesOf(JSON.parse(text)).map((v) => ({
          ...v,
          field: v.field.replace(/(\.workoutSteps)+/, ".workoutSteps"),
        }));
        return { name, values, krd: await read(text) };
      })
    );

    // Act
    const report = firstReadReport(GCN_SOURCE_FIELDS, fixtures);

    // Assert
    expect(report.problems).toEqual([]);
    expect(report.unused).toEqual([]);
  });
});
