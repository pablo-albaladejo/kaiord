#!/usr/bin/env node
/**
 * Generate a SYNTHETIC body-composition FIT fixture for round-trip testing.
 *
 * Run from the @kaiord/fit package directory:
 *   pnpm --filter @kaiord/fit exec node scripts/generate-synthetic-body-composition-fixture.mjs
 *
 * Writes to `<repo-root>/test-fixtures/fit/HealthBodyComposition.fit`.
 *
 * The fixture is deterministic — re-running produces a byte-identical
 * file — so it can live in the repo without drift.
 *
 * IMPORTANT: this file is SYNTHETIC. It does not come from a real Garmin
 * scale. The values are plausible (weight ~75 kg, bodyFat ~20 %,
 * bodyWater ~55 %, muscle ~33 kg, bonemass ~3 kg) but no real athlete
 * produced them. Once a real-device body-composition FIT export is
 * available, replace this fixture with the real one and delete this
 * generator.
 *
 * Note: @garmin/fitsdk 21.202.0 does not ship a `bodyComposition`
 * (mesgNum 41) entry in `Profile.messages`, so we register a minimal
 * one at runtime before constructing the Encoder. Field numbers below
 * are taken from the FIT SDK profile (body_composition message).
 *
 * Spec reference: https://github.com/garmin/fit-javascript-sdk
 */
import { Encoder } from "@garmin/fitsdk";
import Profile from "@garmin/fitsdk/src/profile.js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve(
  import.meta.dirname,
  "../../../test-fixtures/fit/HealthBodyComposition.fit"
);

const FILE_ID_MESG_NUM = 0;
const BODY_COMPOSITION_MESG_NUM = 41;
const GARMIN_MANUFACTURER_ID = 1;
const INDEX_S2_PRODUCT_ID = 4063;
const FIT_KG_SCALE = 100;
const PERCENT_SCALE = 100;
const BMI_SCALE = 10;

const baseField = (extra) => ({
  array: false,
  scale: 1,
  offset: 0,
  units: "",
  bits: [],
  components: [],
  isAccumulated: false,
  hasComponents: false,
  subFields: [],
  ...extra,
});

Profile.messages[BODY_COMPOSITION_MESG_NUM] = {
  num: BODY_COMPOSITION_MESG_NUM,
  name: "bodyComposition",
  messagesKey: "bodyCompositionMesgs",
  fields: {
    253: baseField({
      num: 253,
      name: "timestamp",
      type: "dateTime",
      baseType: "uint32",
    }),
    0: baseField({
      num: 0,
      name: "percentFat",
      type: "uint16",
      baseType: "uint16",
      scale: PERCENT_SCALE,
      units: "%",
    }),
    1: baseField({
      num: 1,
      name: "percentHydration",
      type: "uint16",
      baseType: "uint16",
      scale: PERCENT_SCALE,
      units: "%",
    }),
    4: baseField({
      num: 4,
      name: "boneMass",
      type: "uint16",
      baseType: "uint16",
      scale: FIT_KG_SCALE,
      units: "kg",
    }),
    5: baseField({
      num: 5,
      name: "muscleMass",
      type: "uint16",
      baseType: "uint16",
      scale: FIT_KG_SCALE,
      units: "kg",
    }),
    8: baseField({
      num: 8,
      name: "bmi",
      type: "uint16",
      baseType: "uint16",
      scale: BMI_SCALE,
      units: "",
    }),
  },
};

const encoder = new Encoder();

// 1. file_id — required first message of any FIT file. Garmin reuses
// the `weight` file_type for body-composition-only payloads.
encoder.writeMesg({
  mesgNum: FILE_ID_MESG_NUM,
  type: "weight",
  manufacturer: GARMIN_MANUFACTURER_ID,
  product: INDEX_S2_PRODUCT_ID,
  serialNumber: 1234567890,
  timeCreated: new Date("2026-05-22T07:15:00.000Z"),
});

// 2. body_composition — a single snapshot from a smart scale.
encoder.writeMesg({
  mesgNum: BODY_COMPOSITION_MESG_NUM,
  timestamp: new Date("2026-05-22T07:15:00.000Z"),
  percentFat: 20.0,
  percentHydration: 55.0,
  muscleMass: 33.0,
  boneMass: 3.0,
  bmi: 23.5,
});

const buffer = encoder.close();
writeFileSync(OUTPUT_PATH, buffer);
console.log(`Wrote ${buffer.byteLength} bytes to ${OUTPUT_PATH}`);
