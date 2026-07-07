import type { LabValue } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { resolveReferenceBand } from "./reference-band";

const VIT_D_CANON_LOW = 30;
const VIT_D_CANON_HIGH = 50;
const VIT_D_RAW_LOW = 75;
const VIT_D_RAW_HIGH = 125;
const OLD_LOW = 40;
const OLD_HIGH = 60;

const value = (
  overrides: Partial<LabValue> & Pick<LabValue, "id" | "date">
): LabValue => ({
  profileId: "p1",
  reportId: "r1",
  parameterKey: "vitamin_d",
  valueRaw: 1,
  unitRaw: "nmol/L",
  valueCanonical: 1,
  unitCanonical: "ng/mL",
  refSource: "report",
  flag: "unknown",
  provenance: { source: "manual" },
  ...overrides,
});

describe("resolveReferenceBand", () => {
  it("should build the band from canonical bounds, not the raw report bounds (C1)", () => {
    // Arrange
    const values = [
      value({
        id: "v1",
        date: "2026-03-01",
        refLow: VIT_D_RAW_LOW,
        refHigh: VIT_D_RAW_HIGH,
        refLowCanonical: VIT_D_CANON_LOW,
        refHighCanonical: VIT_D_CANON_HIGH,
      }),
    ];

    // Act
    const band = resolveReferenceBand(values);

    // Assert
    expect(band).toEqual({ low: VIT_D_CANON_LOW, high: VIT_D_CANON_HIGH });
  });

  it("should use the most recent value's range when the range varies between reports", () => {
    // Arrange
    const values = [
      value({
        id: "v-old",
        date: "2025-06-01",
        refLowCanonical: OLD_LOW,
        refHighCanonical: OLD_HIGH,
      }),
      value({
        id: "v-new",
        date: "2026-03-01",
        refLowCanonical: VIT_D_CANON_LOW,
        refHighCanonical: VIT_D_CANON_HIGH,
      }),
    ];

    // Act
    const band = resolveReferenceBand(values);

    // Assert
    expect(band).toEqual({ low: VIT_D_CANON_LOW, high: VIT_D_CANON_HIGH });
  });

  it("should fall back to an older value that carries a range when the newest lacks one", () => {
    // Arrange
    const values = [
      value({
        id: "v-old",
        date: "2025-06-01",
        refLowCanonical: OLD_LOW,
        refHighCanonical: OLD_HIGH,
      }),
      value({ id: "v-new", date: "2026-03-01" }),
    ];

    // Act
    const band = resolveReferenceBand(values);

    // Assert
    expect(band).toEqual({ low: OLD_LOW, high: OLD_HIGH });
  });

  it("should return null when no value carries both canonical bounds", () => {
    // Arrange
    const values = [
      value({ id: "v1", date: "2026-03-01" }),
      value({ id: "v2", date: "2026-01-01", refLowCanonical: OLD_LOW }),
    ];

    // Act
    const band = resolveReferenceBand(values);

    // Assert
    expect(band).toBeNull();
  });
});
