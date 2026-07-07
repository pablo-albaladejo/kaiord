/**
 * Cross-path tests for F1.1 health provenance: FIT drag-drop and manual
 * entry must write the identical provenance shape (same `stampProvenance`
 * constructor), and a FIT re-import must never clobber a manual edit
 * for the same day.
 */
import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { importHealthFitFile } from "./import-health-fit-file.use-case";
import { saveManualHealthMetric } from "./save-manual-health-metric.use-case";

const PROFILE_ID = "p-1";
const DAY = "2026-05-23";
const MANUAL_DAY = "2026-05-24";
const MANUAL_WEIGHT_KG = 71;
const FIT_WEIGHT_KG = 75;

const weightKrd = (day: string, weightKilograms: number): KRD => ({
  version: "2.0",
  type: "weight_measurement",
  metadata: { created: `${day}T07:00:00.000Z` },
  extensions: {
    health: {
      weight: {
        kind: "weight",
        version: "2.0",
        measuredAt: `${day}T08:00:00.000Z`,
        weightKilograms,
      },
    },
  },
});

describe("health import — FIT vs manual provenance", () => {
  it("should write the identical provenance shape from both entry paths", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      weightKrd(DAY, FIT_WEIGHT_KG)
    );
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: MANUAL_DAY, value: MANUAL_WEIGHT_KG }
    );

    // Assert
    const [fitRow] = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    const [manualRow] = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      MANUAL_DAY,
      MANUAL_DAY
    );
    expect(fitRow?.sourceBridgeId).toBe("fit-import");
    expect(manualRow?.sourceBridgeId).toBe("manual");
    expect(typeof fitRow?.externalId).toBe("string");
    expect(typeof manualRow?.externalId).toBe("string");
    expect(fitRow?.externalId).not.toBe("");
    expect(manualRow?.externalId).not.toBe("");
  });

  it("should not overwrite a manual edit when the same-day FIT file is re-imported", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: MANUAL_WEIGHT_KG }
    );

    // Act
    await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      weightKrd(DAY, FIT_WEIGHT_KG)
    );

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    const manualRow = rows.find((r) => r.sourceBridgeId === "manual");
    const fitRow = rows.find((r) => r.sourceBridgeId === "fit-import");
    expect(rows).toHaveLength(2);
    expect(manualRow?.krd.weightKilograms).toBe(MANUAL_WEIGHT_KG);
    expect(fitRow?.krd.weightKilograms).toBe(FIT_WEIGHT_KG);
  });
});
