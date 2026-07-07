/**
 * saveLabReport — persist one `LabReport` plus its N `LabValue` rows in a
 * SINGLE transaction, so a partial write can never leave a report without its
 * values (or values without their report). Report and values arrive already
 * built and validated by the caller (the entry form), each carrying its
 * `provenance` (V1: `source: "manual"`); this use case only commits them
 * atomically through the port's `transaction`.
 */
import type { LabReport, LabValue } from "@kaiord/core";

import type { LabPersistence } from "./lab-persistence";

export const saveLabReport = async (
  persistence: LabPersistence,
  report: LabReport,
  values: readonly LabValue[]
): Promise<void> => {
  await persistence.transaction(async () => {
    await persistence.labs.putReport(report);
    await persistence.labs.putValues(values);
  });
};
