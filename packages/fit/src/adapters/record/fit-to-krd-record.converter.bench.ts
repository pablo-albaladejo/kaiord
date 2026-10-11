/**
 * Throughput of the FIT→KRD record batch. Run with `pnpm --filter
 * @kaiord/fit bench`. Not a pass/fail gate: the target (10k records well
 * under 500ms) is tracked here because a wall-clock assertion in the unit
 * suite fails whenever the worker is descheduled, whatever the code does.
 */
import { it } from "vitest";

import {
  PERF_RECORD_BATCH_SIZE,
  SAMPLE_TIMESTAMP_2024_01_01_SEC,
} from "../../test-utils/constants";
import { convertFitToKrdRecords } from "./fit-to-krd-record.converter";

const fitRecords = Array.from({ length: PERF_RECORD_BATCH_SIZE }, (_, i) => ({
  timestamp: SAMPLE_TIMESTAMP_2024_01_01_SEC + i,
  heartRate: 145,
  cadence: 90,
  power: 250,
}));

it("should measure convertFitToKrdRecords over 10000 records", async ({
  bench,
}) => {
  await bench("10000 records", () => {
    convertFitToKrdRecords(fitRecords);
  }).run();
});
