/**
 * The first read of every ZWO workout fixture: each value the file holds,
 * listed by an XML parse of its own, must be in the KRD the ZWO reader makes
 * of it, or be declared below as a field KRD does not carry.
 */
import type { SourceField } from "@kaiord/core/test-utils";
import {
  createMockLogger,
  firstReadReport,
  loadZwoFixture,
  sourceValuesOf,
} from "@kaiord/core/test-utils";
import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";

import { createFastXmlZwiftReader } from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

type Rec = Record<string, unknown>;

const FILE = "workout_file";
const STEP = `${FILE}.workout.**`;
const KRD_W = "extensions.structured_workout";
const KRD_STEP = `${KRD_W}.**.steps.*`;
const K = "@_kaiord:";

const has = (attribute: string) => (c: Rec) =>
  c[`${K}${attribute}`] !== undefined;
const REPEAT_UNTIL = (c: Rec) =>
  String(c[`${K}originalDurationType`]).startsWith("repeat_until_");
const REPEAT_UNTIL_REASON =
  "a repeat-until end needs the step it repeats from, which a ZWO interval does not hold; the reader reads the interval's time";

/** Every field the ZWO workout fixtures hold, and what the first read makes of it. */
const ZWO_SOURCE_FIELDS: ReadonlyArray<SourceField> = [
  { source: "?xml.**", notCarried: "the XML declaration" },
  { source: `${FILE}.@_xmlns:kaiord`, notCarried: "the kaiord namespace" },
  { source: `${FILE}.${K}timeCreated`, krd: ["metadata.created"] },
  { source: `${FILE}.${K}manufacturer`, krd: ["metadata.manufacturer"] },
  { source: `${FILE}.${K}product`, krd: ["metadata.product"] },
  {
    source: `${FILE}.${K}serialNumber`,
    krd: ["metadata.serialNumber"],
    as: String,
  },
  { source: `${FILE}.name`, krd: [`${KRD_W}.name`] },
  {
    source: `${FILE}.sportType`,
    krd: [`${KRD_W}.sport`],
    as: (v) => ({ bike: "cycling", run: "running" })[String(v)],
  },
  { source: `${STEP}.@_Repeat`, krd: [`${KRD_W}.steps.*.repeatCount`] },
  { source: `${STEP}.${K}name`, krd: [`${KRD_STEP}.name`] },
  { source: `${STEP}.${K}intensity`, krd: [`${KRD_STEP}.intensity`] },
  {
    source: `${STEP}.@_Duration`,
    when: REPEAT_UNTIL,
    krd: [`${KRD_STEP}.duration.seconds`],
  },
  { source: `${STEP}.*`, when: REPEAT_UNTIL, notCarried: REPEAT_UNTIL_REASON },
  {
    source: `${STEP}.@_Duration`,
    when: has("originalDurationType"),
    notCarried:
      "Zwift's time for an interval that ends otherwise; the reader reads the kaiord end instead",
  },
  { source: `${STEP}.@_Duration`, krd: [`${KRD_STEP}.duration.seconds`] },
  {
    source: `${STEP}.${K}originalDurationType`,
    krd: [`${KRD_STEP}.duration.type`],
  },
  {
    source: `${STEP}.${K}originalDurationMeters`,
    krd: [`${KRD_STEP}.duration.meters`],
  },
  {
    source: `${STEP}.${K}originalDurationBpm`,
    krd: [`${KRD_STEP}.duration.bpm`],
  },
  ...["@_Power", "@_PowerLow", "@_PowerHigh"].map((attribute) => ({
    source: `${STEP}.${attribute}`,
    when: (c: Rec) => has("powerZone")(c) || has("originalWattsLow")(c),
    notCarried:
      "Zwift's share of FTP for a target the kaiord attributes hold exactly",
  })),
  {
    source: `${STEP}.${K}assumedFtp`,
    notCarried:
      "the FTP the writer turned watts into Zwift's share of FTP with; KRD keeps the watts",
  },
  {
    source: `${STEP}.${K}powerUnit`,
    krd: [`${KRD_STEP}.target.value.unit`],
    as: (v, c) => (has("originalWattsLow")(c) ? "range" : v),
  },
  { source: `${STEP}.${K}powerZone`, krd: [`${KRD_STEP}.target.value.value`] },
  {
    source: `${STEP}.${K}originalWattsLow`,
    krd: [`${KRD_STEP}.target.value.min`],
  },
  {
    source: `${STEP}.${K}originalWattsHigh`,
    krd: [`${KRD_STEP}.target.value.max`],
  },
  {
    source: `${STEP}.${K}hrTargetZone`,
    krd: [`${KRD_STEP}.target.value.value`],
  },
  { source: `${STEP}.${K}hrTargetLow`, krd: [`${KRD_STEP}.target.value.min`] },
  {
    source: `${STEP}.${K}hrTargetHigh`,
    krd: [`${KRD_STEP}.target.value.max`],
  },
];

const FIXTURES = [
  "WorkoutCustomTargetValues.zwo",
  "WorkoutIndividualSteps.zwo",
  "WorkoutRepeatGreaterThanStep.zwo",
  "WorkoutRepeatSteps.zwo",
];

const lowerFirst = (key: string) =>
  K + key.charAt(K.length).toLowerCase() + key.slice(K.length + 1);

/** An IntervalsT is an on and an off interval, each named like a SteadyState. */
const splitIntervals = (element: Rec): Rec => {
  const half = (prefix: "on" | "off"): Rec => {
    const out: Rec = {};
    for (const [key, value] of Object.entries(element)) {
      const plain = key
        .replace(`@_${prefix === "on" ? "On" : "Off"}`, "@_")
        .replace(`${K}${prefix}`, K);
      if (plain === key) continue;
      out[plain.startsWith(K) ? lowerFirst(plain) : plain] = value;
    }
    return out;
  };
  return { "@_Repeat": element["@_Repeat"], On: half("on"), Off: half("off") };
};

const parse = (text: string): Rec => {
  const tree = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
  }).parse(text) as Rec;
  const workout = (tree.workout_file as Rec).workout as Rec;
  const intervals = workout.IntervalsT;
  if (intervals !== undefined)
    workout.IntervalsT = ([] as Array<Rec>)
      .concat(intervals as Rec)
      .map(splitIntervals);
  return tree;
};

const logger = createMockLogger();
const read = createFastXmlZwiftReader(logger, createXsdZwiftValidator(logger));

describe("First read: ZWO", () => {
  it("should read every value of every ZWO workout fixture that KRD can hold", async () => {
    // Arrange
    const fixtures = await Promise.all(
      FIXTURES.map(async (name) => {
        const text = loadZwoFixture(name);
        const values = sourceValuesOf(parse(text));
        return { name, values, krd: await read(text) };
      })
    );

    // Act
    const report = firstReadReport(ZWO_SOURCE_FIELDS, fixtures);

    // Assert
    expect(report.problems).toEqual([]);
    expect(report.unused).toEqual([]);
  });
});
