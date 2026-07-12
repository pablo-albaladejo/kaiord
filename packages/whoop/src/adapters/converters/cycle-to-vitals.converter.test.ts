import {
  VITALS_RESPIRATORY_RATE_TOLERANCE,
  VITALS_RESTING_HEART_RATE_TOLERANCE,
  VITALS_SPO2_TOLERANCE,
  vitalsSummarySchema,
} from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  CYCLES_DETAILS_RECORDS,
  CYCLES_DETAILS_WRAPPED,
} from "../../test-utils/cycles-fixture";
import { whoopCyclesResponseSchema } from "../schemas/whoop-cycles.schema";
import { cycleToVitals } from "./cycle-to-vitals.converter";

const [RECORD] = whoopCyclesResponseSchema.parse(CYCLES_DETAILS_WRAPPED);

const EXPECTED_RESPIRATORY_RATE = 17.05;
const EXPECTED_SPO2_PERCENT = 96;
const EXPECTED_SKIN_TEMP_CELSIUS = 33.4;
const EXPECTED_RESTING_HEART_RATE = 55;
const EXPECTED_MEASURED_AT = "2026-07-10T17:59:12.250Z";

describe("cycleToVitals", () => {
  it("should map a cycle's recovery and first sleep to a vitals summary", () => {
    // Arrange
    const { cycle } = RECORD;

    // Act
    const vitals = cycleToVitals(RECORD);

    // Assert
    expect(
      Math.abs((vitals?.respiratoryRate ?? 0) - EXPECTED_RESPIRATORY_RATE)
    ).toBeLessThanOrEqual(VITALS_RESPIRATORY_RATE_TOLERANCE);
    expect(
      Math.abs((vitals?.spo2Percent ?? 0) - EXPECTED_SPO2_PERCENT)
    ).toBeLessThanOrEqual(VITALS_SPO2_TOLERANCE);
    expect(vitals?.skinTempCelsius).toBe(EXPECTED_SKIN_TEMP_CELSIUS);
    expect(
      Math.abs((vitals?.restingHeartRate ?? 0) - EXPECTED_RESTING_HEART_RATE)
    ).toBeLessThanOrEqual(VITALS_RESTING_HEART_RATE_TOLERANCE);
    expect(vitals?.measuredAt).toBe(EXPECTED_MEASURED_AT);
    expect(vitals?.sourceBridgeId).toBe("whoop-bridge");
    expect(vitals?.version).toBe("2.0");
    expect(vitals?.externalId).toBe(`cycle:${cycle.id}:vitals`);
  });

  it("should produce a vitals summary that validates against the KRD schema", () => {
    // Arrange
    const vitals = cycleToVitals(RECORD);

    // Act
    const result = vitalsSummarySchema.safeParse(vitals);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should return null when none of the four measurements are present", () => {
    // Arrange
    const record = {
      ...RECORD,
      recovery: {
        ...RECORD.recovery,
        resting_heart_rate: undefined,
        spo2: undefined,
        skin_temp_celsius: undefined,
      },
      sleeps: [{ ...RECORD.sleeps[0], respiratory_rate: undefined }],
    };

    // Act
    const vitals = cycleToVitals(record);

    // Assert
    expect(vitals).toBeNull();
  });

  it("should omit skinTempCelsius when recovery has none", () => {
    // Arrange
    const record = {
      ...RECORD,
      recovery: { ...RECORD.recovery, skin_temp_celsius: undefined },
    };

    // Act
    const vitals = cycleToVitals(record);

    // Assert
    expect(vitals).not.toBeNull();
    expect(vitals && "skinTempCelsius" in vitals).toBe(false);
  });

  it("should parse the window and skip fields when metrics are explicitly null", () => {
    // Arrange
    // WHOOP may send `null` (not omission) for an unrecorded metric; that must
    // not fail the whole-window parse (which would drop Wave-1 hrv/sleep too)
    // and must not emit a KRD-invalid `null`.
    const rawRecovery = CYCLES_DETAILS_RECORDS[0].recovery as Record<
      string,
      unknown
    >;
    const rawSleep = CYCLES_DETAILS_RECORDS[0].sleeps[0] as Record<
      string,
      unknown
    >;
    const raw = {
      records: [
        {
          cycle: CYCLES_DETAILS_RECORDS[0].cycle,
          recovery: { ...rawRecovery, spo2: null, skin_temp_celsius: null },
          sleeps: [{ ...rawSleep, respiratory_rate: null }],
        },
      ],
    };

    // Act
    const parsed = whoopCyclesResponseSchema.safeParse(raw);

    // Assert
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const vitals = cycleToVitals(parsed.data[0]);
    expect(vitals).not.toBeNull();
    expect(vitals && "spo2Percent" in vitals).toBe(false);
    expect(vitals && "skinTempCelsius" in vitals).toBe(false);
    expect(vitals && "respiratoryRate" in vitals).toBe(false);
    expect(vitals?.restingHeartRate).toBe(EXPECTED_RESTING_HEART_RATE);
  });

  it("should treat a resting_heart_rate of 0 as absent", () => {
    // Arrange
    // 0 is WHOOP's "no reading" sentinel, not a real resting HR, and would
    // violate the KRD `restingHeartRate` positivity invariant.
    const record = {
      ...RECORD,
      recovery: { ...RECORD.recovery, resting_heart_rate: 0 },
    };

    // Act
    const vitals = cycleToVitals(record);

    // Assert
    expect(vitals && "restingHeartRate" in vitals).toBe(false);
  });
});
