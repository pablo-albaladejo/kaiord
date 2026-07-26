import { STRAIN_SCORE_TOLERANCE, strainSummarySchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  CYCLES_DETAILS_RECORDS,
  CYCLES_DETAILS_WRAPPED,
} from "../../test-utils/cycles-fixture";
import { whoopCyclesResponseSchema } from "../schemas/whoop-cycles.schema";
import { cycleToStrain } from "./cycle-to-strain.converter";

const [RECORD] = whoopCyclesResponseSchema.parse(CYCLES_DETAILS_WRAPPED);

const EXPECTED_STRAIN_SCORE = 5.36;
const EXPECTED_ENERGY_KILOJOULES = 8597.02;
const EXPECTED_DAY_AVERAGE_HEART_RATE = 60;
const EXPECTED_DAY_MAX_HEART_RATE = 122;
const EXPECTED_DATE = "2026-07-10";

describe("cycleToStrain", () => {
  it("should map a cycle to a strain summary", () => {
    // Arrange
    const { cycle } = RECORD;

    // Act
    const strain = cycleToStrain(RECORD);

    // Assert
    expect(
      Math.abs((strain?.strainScore ?? 0) - EXPECTED_STRAIN_SCORE)
    ).toBeLessThanOrEqual(STRAIN_SCORE_TOLERANCE);
    expect(strain?.energyKilojoules).toBe(EXPECTED_ENERGY_KILOJOULES);
    expect(strain?.date).toBe(EXPECTED_DATE);
    expect(strain?.sourceBridgeId).toBe("whoop-bridge");
    expect(strain?.version).toBe("2.0");
    expect(strain?.externalId).toBe(`cycle:${cycle.id}:strain`);
  });

  it("should produce a strain summary that validates against the KRD schema", () => {
    // Arrange
    const strain = cycleToStrain(RECORD);

    // Act
    const result = strainSummarySchema.safeParse(strain);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should set day-level heart-rate fields from day_avg_heart_rate and day_max_heart_rate", () => {
    // Arrange

    // Act
    const strain = cycleToStrain(RECORD);

    // Assert
    expect(strain?.dayAverageHeartRate).toBe(EXPECTED_DAY_AVERAGE_HEART_RATE);
    expect(strain?.dayMaxHeartRate).toBe(EXPECTED_DAY_MAX_HEART_RATE);
  });

  it("should omit both day heart-rate fields when day_max_heart_rate is below day_avg_heart_rate", () => {
    // Arrange
    // WHOOP computes the two day-HR aggregates independently and they can
    // occasionally invert; the KRD refine requires dayMax >= dayAverage, so
    // an inverted pair must be dropped entirely rather than emitted invalid.
    const record = {
      ...RECORD,
      cycle: {
        ...RECORD.cycle,
        day_avg_heart_rate: EXPECTED_DAY_MAX_HEART_RATE,
        day_max_heart_rate: EXPECTED_DAY_AVERAGE_HEART_RATE,
      },
    };

    // Act
    const strain = cycleToStrain(record);

    // Assert
    expect(strain?.dayAverageHeartRate).toBeUndefined();
    expect(strain?.dayMaxHeartRate).toBeUndefined();
  });

  it("should return null when scaled_strain is missing", () => {
    // Arrange
    const record = {
      ...RECORD,
      cycle: { ...RECORD.cycle, scaled_strain: undefined },
    };

    // Act
    const strain = cycleToStrain(record);

    // Assert
    expect(strain).toBeNull();
  });

  it("should return null when days is missing", () => {
    // Arrange
    const record = {
      ...RECORD,
      cycle: { ...RECORD.cycle, days: undefined },
    };

    // Act
    const strain = cycleToStrain(record);

    // Assert
    expect(strain).toBeNull();
  });

  it("should return null when days does not contain a parseable date", () => {
    // Arrange
    const record = {
      ...RECORD,
      cycle: { ...RECORD.cycle, days: "not-a-date-range" },
    };

    // Act
    const strain = cycleToStrain(record);

    // Assert
    expect(strain).toBeNull();
  });

  it("should parse the window and omit energyKilojoules when day_kilojoules is null", () => {
    // Arrange
    // An explicit `null` day_kilojoules must not fail the whole-window parse
    // nor emit a KRD-invalid `null` energy value.
    const rawCycle = CYCLES_DETAILS_RECORDS[0].cycle as Record<string, unknown>;
    const raw = {
      records: [
        {
          cycle: { ...rawCycle, day_kilojoules: null },
          recovery: CYCLES_DETAILS_RECORDS[0].recovery,
          sleeps: CYCLES_DETAILS_RECORDS[0].sleeps,
        },
      ],
    };

    // Act
    const parsed = whoopCyclesResponseSchema.safeParse(raw);

    // Assert
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const strain = cycleToStrain(parsed.data[0]);
    expect(strain).not.toBeNull();
    expect(strain && "energyKilojoules" in strain).toBe(false);
  });
});
