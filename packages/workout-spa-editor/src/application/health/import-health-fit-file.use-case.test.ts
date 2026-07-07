import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import {
  importHealthFitFile,
  MissingHealthPayloadError,
  UnsupportedHealthKrdError,
} from "./import-health-fit-file.use-case";

const PROFILE_ID = "p-1";
const SAMPLE_WEIGHT_KG = 75;
const SAMPLE_STEPS = 8000;
const SAMPLE_ACTIVE_KCAL = 400;
const SAMPLE_REST_KCAL = 1800;
const SAMPLE_RMSSD = 45;
const SAMPLE_AVG = 30;
const SAMPLE_PEAK = 70;

const baseMeta = { created: "2026-05-23T07:00:00.000Z" };

const sleepKrd = (): KRD => ({
  version: "2.0",
  type: "sleep_record",
  metadata: baseMeta,
  extensions: {
    health: {
      sleep: {
        kind: "sleep",
        version: "2.0",
        startTime: "2026-05-23T22:00:00.000Z",
        endTime: "2026-05-24T06:00:00.000Z",
        stages: [],
      },
    },
  },
});

const weightKrd = (weightKilograms: number): KRD => ({
  version: "2.0",
  type: "weight_measurement",
  metadata: baseMeta,
  extensions: {
    health: {
      weight: {
        kind: "weight",
        version: "2.0",
        measuredAt: "2026-05-23T08:00:00.000Z",
        weightKilograms,
      },
    },
  },
});

describe("importHealthFitFile", () => {
  it("should persist a sleep KRD into healthSleep with date derived from startTime", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      sleepKrd()
    );

    // Assert
    expect(result.type).toBe("sleep_record");
    const row = await persistence.healthSleep.getById(result.recordId);
    expect(row?.profileId).toBe(PROFILE_ID);
    expect(row?.date).toBe("2026-05-23");
  });

  it("should persist a daily_wellness KRD using the payload's date field directly", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const krd: KRD = {
      version: "2.0",
      type: "daily_wellness",
      metadata: baseMeta,
      extensions: {
        health: {
          daily: {
            kind: "daily",
            version: "2.0",
            date: "2026-05-22",
            steps: SAMPLE_STEPS,
            activeCalories: SAMPLE_ACTIVE_KCAL,
            restingCalories: SAMPLE_REST_KCAL,
            intensityMinutes: { moderate: 0, vigorous: 0 },
          },
        },
      },
    };

    // Act
    const result = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      krd
    );

    // Assert
    const row = await persistence.healthDaily.getById(result.recordId);
    expect(row?.date).toBe("2026-05-22");
  });

  it("should persist a stress KRD using startTime for the date column", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const krd: KRD = {
      version: "2.0",
      type: "stress_episode",
      metadata: baseMeta,
      extensions: {
        health: {
          stress: {
            kind: "stress",
            version: "2.0",
            startTime: "2026-05-23T08:00:00.000Z",
            endTime: "2026-05-23T10:00:00.000Z",
            averageLevel: SAMPLE_AVG,
            peakLevel: SAMPLE_PEAK,
          },
        },
      },
    };

    // Act
    const result = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      krd
    );

    // Assert
    const row = await persistence.healthStress.getById(result.recordId);
    expect(row?.date).toBe("2026-05-23");
  });

  it("should persist a weight KRD into healthWeight", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      weightKrd(SAMPLE_WEIGHT_KG)
    );

    // Assert
    const row = await persistence.healthWeight.getById(result.recordId);
    expect(row?.krd.weightKilograms).toBe(SAMPLE_WEIGHT_KG);
  });

  it("should persist an HRV KRD into healthHrv", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const krd: KRD = {
      version: "2.0",
      type: "hrv_summary",
      metadata: baseMeta,
      extensions: {
        health: {
          hrv: {
            kind: "hrv",
            version: "2.0",
            measuredAt: "2026-05-23T07:00:00.000Z",
            rMSSD: SAMPLE_RMSSD,
            measurementWindow: "overnight",
          },
        },
      },
    };

    // Act
    const result = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      krd
    );

    // Assert
    const row = await persistence.healthHrv.getById(result.recordId);
    expect(row?.krd.rMSSD).toBe(SAMPLE_RMSSD);
  });

  it("should stamp sourceBridgeId 'fit-import' and a content-hash externalId", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      weightKrd(SAMPLE_WEIGHT_KG)
    );

    // Assert
    const row = await persistence.healthWeight.getById(result.recordId);
    expect(row?.sourceBridgeId).toBe("fit-import");
    expect(row?.externalId).toBeTruthy();
  });

  it("should produce zero new rows when the same FIT weight KRD is imported twice", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const krd = weightKrd(SAMPLE_WEIGHT_KG);

    // Act
    const first = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      krd
    );
    const second = await importHealthFitFile(
      { persistence, profileId: PROFILE_ID },
      krd
    );

    // Assert
    expect(second.recordId).toBe(first.recordId);
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      "2026-05-23",
      "2026-05-23"
    );
    expect(rows).toHaveLength(1);
  });

  it("should throw UnsupportedHealthKrdError when the KRD type is not a health type", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { ...baseMeta, sport: "cycling" },
    };

    // Act

    // Assert
    await expect(
      importHealthFitFile({ persistence, profileId: PROFILE_ID }, krd)
    ).rejects.toBeInstanceOf(UnsupportedHealthKrdError);
  });

  it("should throw MissingHealthPayloadError when extensions.health is empty", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const krd: KRD = {
      version: "2.0",
      type: "sleep_record",
      metadata: baseMeta,
    };

    // Act

    // Assert
    await expect(
      importHealthFitFile({ persistence, profileId: PROFILE_ID }, krd)
    ).rejects.toBeInstanceOf(MissingHealthPayloadError);
  });
});
