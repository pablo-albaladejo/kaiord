import { describe, expect, it } from "vitest";

import {
  CYCLES_DETAILS_RECORDS,
  CYCLES_DETAILS_WRAPPED,
} from "../../test-utils/cycles-fixture";
import { whoopCyclesResponseSchema } from "./whoop-cycles.schema";

const EXPECTED_CYCLE_ID = 1629599351;
const EXPECTED_HRV_RMSSD = 0.0571;

describe("whoopCyclesResponseSchema", () => {
  it("should parse a bare-array cycles/details response", () => {
    // Arrange
    const payload = CYCLES_DETAILS_RECORDS;

    // Act
    const result = whoopCyclesResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.[0].cycle.id).toBe(EXPECTED_CYCLE_ID);
  });

  it("should parse a records-wrapped cycles/details response", () => {
    // Arrange
    const payload = CYCLES_DETAILS_WRAPPED;

    // Act
    const result = whoopCyclesResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.[0].recovery.hrv_rmssd).toBe(EXPECTED_HRV_RMSSD);
  });

  it("should normalize both shapes to the same records array", () => {
    // Arrange

    // Act
    const bare = whoopCyclesResponseSchema.parse(CYCLES_DETAILS_RECORDS);
    const wrapped = whoopCyclesResponseSchema.parse(CYCLES_DETAILS_WRAPPED);

    // Assert
    expect(bare).toEqual(wrapped);
  });

  it("should reject a record whose recovery omits hrv_rmssd", () => {
    // Arrange
    const payload = [
      {
        cycle: { id: 1 },
        recovery: {
          recovery_score: 66,
          created_at: "2026-07-10T17:59:12.250Z",
        },
        sleeps: [],
      },
    ];

    // Act
    const result = whoopCyclesResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });
});
