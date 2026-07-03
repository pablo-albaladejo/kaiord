import { hrvSummarySchema, krdSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { SCORED_RECOVERY, UNSCORED_RECOVERY } from "../../test-utils/fixtures";
import { mapWhoopRecoveryToKrd } from "./recovery-to-krd.converter";

const EXPECTED_SCORE = 44;
const EXPECTED_RMSSD = 31.813562;
const RMSSD_PRECISION = 5;

describe("mapWhoopRecoveryToKrd", () => {
  it("should map recovery_score to hrv_summary.score and rMSSD from hrv_rmssd_milli", () => {
    // Arrange
    const recovery = SCORED_RECOVERY;

    // Act
    const krd = mapWhoopRecoveryToKrd(recovery);
    const hrv = krd?.extensions?.health?.hrv;

    // Assert
    expect(krd?.type).toBe("hrv_summary");
    expect(hrv?.score).toBe(EXPECTED_SCORE);
    expect(hrv?.rMSSD).toBeCloseTo(EXPECTED_RMSSD, RMSSD_PRECISION);
    expect(hrv?.measurementWindow).toBe("overnight");
    expect(hrv?.externalId).toBe(recovery.sleep_id);
  });

  it("should produce a KRD that validates against the canonical schema", () => {
    // Arrange
    const krd = mapWhoopRecoveryToKrd(SCORED_RECOVERY);

    // Act
    const result = krdSchema.safeParse(krd);
    const hrvResult = hrvSummarySchema.safeParse(krd?.extensions?.health?.hrv);

    // Assert
    expect(result.success).toBe(true);
    expect(hrvResult.success).toBe(true);
    expect(krd?.metadata.sport).toBeUndefined();
  });

  it.each([
    { label: "an unscored recovery record", recovery: UNSCORED_RECOVERY },
    {
      label: "hrv_rmssd_milli is non-positive",
      recovery: {
        ...SCORED_RECOVERY,
        score: { ...SCORED_RECOVERY.score!, hrv_rmssd_milli: 0 },
      },
    },
  ])("should return undefined when $label", ({ recovery }) => {
    // Arrange

    // Act
    const krd = mapWhoopRecoveryToKrd(recovery);

    // Assert
    expect(krd).toBeUndefined();
  });
});
