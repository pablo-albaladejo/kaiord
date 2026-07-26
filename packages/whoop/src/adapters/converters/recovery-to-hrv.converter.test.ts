import { hrvSummarySchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { CYCLES_DETAILS_WRAPPED } from "../../test-utils/cycles-fixture";
import { whoopCyclesResponseSchema } from "../schemas/whoop-cycles.schema";
import { recoveryToHrv } from "./recovery-to-hrv.converter";

const [RECORD] = whoopCyclesResponseSchema.parse(CYCLES_DETAILS_WRAPPED);

const EXPECTED_RMSSD_MS = 57.1;
const EXPECTED_SCORE = 66;
const ALT_RMSSD_MS = 45;
const RMSSD_PRECISION = 1;

describe("recoveryToHrv", () => {
  it("should map recovery to an overnight HRV summary", () => {
    // Arrange
    const { recovery, cycle } = RECORD;

    // Act
    const hrv = recoveryToHrv(recovery, cycle);

    // Assert
    expect(hrv.rMSSD).toBeCloseTo(EXPECTED_RMSSD_MS, RMSSD_PRECISION);
    expect(hrv.measurementWindow).toBe("overnight");
    expect(hrv.score).toBe(EXPECTED_SCORE);
    expect(hrv.sourceBridgeId).toBe("whoop-bridge");
    expect(hrv.externalId).toBe("cycle:1629599351:hrv");
  });

  it("should convert rMSSD from seconds to milliseconds", () => {
    // Arrange
    const recovery = { ...RECORD.recovery, hrv_rmssd: 0.045 };

    // Act
    const hrv = recoveryToHrv(recovery, RECORD.cycle);

    // Assert
    expect(hrv.rMSSD).toBeCloseTo(ALT_RMSSD_MS, RMSSD_PRECISION);
  });

  it("should produce an HRV summary that validates against the KRD schema", () => {
    // Arrange
    const hrv = recoveryToHrv(RECORD.recovery, RECORD.cycle);

    // Act
    const result = hrvSummarySchema.safeParse(hrv);

    // Assert
    expect(result.success).toBe(true);
  });
});
