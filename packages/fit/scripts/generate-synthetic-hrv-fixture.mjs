#!/usr/bin/env node
/**
 * Generate a SYNTHETIC HRV FIT fixture for round-trip testing.
 *
 * Run from the @kaiord/fit package directory:
 *   pnpm --filter @kaiord/fit exec node scripts/generate-synthetic-hrv-fixture.mjs
 *
 * Writes to `<repo-root>/test-fixtures/fit/HealthHrvOvernight.fit`.
 *
 * The fixture is deterministic — re-running produces a byte-identical
 * file — so it can live in the repo without drift.
 *
 * IMPORTANT: this file is SYNTHETIC. It does not come from a real Garmin
 * device. The data values are plausible (RMSSD ~40–55 ms, balanced HRV
 * status) but no real athlete produced them. Once a real-device HRV FIT
 * export is available, replace this fixture with the real one and
 * delete this generator.
 *
 * Spec reference: https://github.com/garmin/fit-javascript-sdk
 */
import { Encoder } from "@garmin/fitsdk";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve(
  import.meta.dirname,
  "../../../test-fixtures/fit/HealthHrvOvernight.fit",
);

const FILE_ID_MESG_NUM = 0;
const HRV_STATUS_SUMMARY_MESG_NUM = 370;
const HRV_VALUE_MESG_NUM = 371;
const GARMIN_MANUFACTURER_ID = 1;
const HOUR_IN_MS = 60 * 60 * 1000;
const HRV_SAMPLES = 8;
const HRV_BASE_RMSSD_MS = 44;
const HRV_AMPLITUDE_MS = 6;

const encoder = new Encoder();

// 1. file_id — required first message of any FIT file
encoder.writeMesg({
  mesgNum: FILE_ID_MESG_NUM,
  type: "monitoringDaily",
  manufacturer: GARMIN_MANUFACTURER_ID,
  product: 4063,
  serialNumber: 1234567890,
  timeCreated: new Date("2026-05-22T07:00:00.000Z"),
});

// 2. hrv_status_summary — one record describing last night + weekly baseline
encoder.writeMesg({
  mesgNum: HRV_STATUS_SUMMARY_MESG_NUM,
  timestamp: new Date("2026-05-22T07:00:00.000Z"),
  weeklyAverage: 45,
  lastNightAverage: 48,
  lastNight5MinHigh: 72,
  baselineLowUpper: 38,
  baselineBalancedLower: 42,
  baselineBalancedUpper: 58,
  status: "balanced",
});

// 3. hrv_value — eight 5-min RMSSD samples spaced hourly across the night
const overnightStart = new Date("2026-05-21T23:00:00.000Z").getTime();
for (let sampleIndex = 0; sampleIndex < HRV_SAMPLES; sampleIndex += 1) {
  const wave = Math.sin((sampleIndex * Math.PI) / (HRV_SAMPLES - 1));
  const rmssd = HRV_BASE_RMSSD_MS + Math.round(HRV_AMPLITUDE_MS * wave);
  encoder.writeMesg({
    mesgNum: HRV_VALUE_MESG_NUM,
    timestamp: new Date(overnightStart + sampleIndex * HOUR_IN_MS),
    value: rmssd,
  });
}

const buffer = encoder.close();
writeFileSync(OUTPUT_PATH, buffer);
console.log(`Wrote ${buffer.byteLength} bytes to ${OUTPUT_PATH}`);
