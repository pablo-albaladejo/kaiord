import { type DailyWellness } from "@kaiord/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { todayIsoDate } from "../../utils/today-iso-date";
import { saveManualHealthMetric } from "./save-manual-health-metric.use-case";

const PROFILE_ID = "p-1";
const DAY = "2026-05-23";
const SAMPLE_WEIGHT_KG = 75;
const SAMPLE_WEIGHT_KG_2 = 80;
const SAMPLE_SLEEP_SCORE = 88;
const SEVEN_THIRTY = 27000;
const SAMPLE_RMSSD = 45;
const PRIOR_STEPS = 1000;
const NEW_STEPS = 8000;
const PRIOR_ACTIVE_KCAL = 300;
const PRIOR_REST_KCAL = 1700;
const PRIOR_MODERATE_MIN = 20;
const PRIOR_VIGOROUS_MIN = 5;

let counter = 0;
const sequentialNewId = (): string => `id-${(counter += 1)}`;

const priorDaily = (): DailyWellness => ({
  kind: "daily",
  version: "2.0",
  date: DAY,
  steps: PRIOR_STEPS,
  activeCalories: PRIOR_ACTIVE_KCAL,
  restingCalories: PRIOR_REST_KCAL,
  intensityMinutes: {
    moderate: PRIOR_MODERATE_MIN,
    vigorous: PRIOR_VIGOROUS_MIN,
  },
});

describe("saveManualHealthMetric", () => {
  it("should write a new weight record for a day with no prior weight", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: SAMPLE_WEIGHT_KG }
    );

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.krd.weightKilograms).toBe(SAMPLE_WEIGHT_KG);
    expect(result?.recordId).toBe(rows[0]?.id);
  });

  it("should reuse the existing record id when a weight already exists for that day", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const deps = { persistence, profileId: PROFILE_ID, newId: sequentialNewId };

    // Act
    const first = await saveManualHealthMetric(deps, {
      metric: "weight",
      day: DAY,
      value: SAMPLE_WEIGHT_KG,
    });
    const second = await saveManualHealthMetric(deps, {
      metric: "weight",
      day: DAY,
      value: SAMPLE_WEIGHT_KG_2,
    });

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(1);
    expect(second?.recordId).toBe(first?.recordId);
    expect(rows[0]?.krd.weightKilograms).toBe(SAMPLE_WEIGHT_KG_2);
  });

  it("should stamp sourceBridgeId 'manual' and an externalId on a new record", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: SAMPLE_WEIGHT_KG }
    );

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.sourceBridgeId).toBe("manual");
    expect(rows[0]?.externalId).toBeTruthy();
  });

  it("should keep the same externalId when editing the day's value (one updated row, not a duplicate)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: SAMPLE_WEIGHT_KG }
    );
    const before = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: SAMPLE_WEIGHT_KG_2 }
    );

    // Assert
    const after = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe(before[0]?.id);
    expect(after[0]?.externalId).toBe(before[0]?.externalId);
    expect(after[0]?.krd.weightKilograms).toBe(SAMPLE_WEIGHT_KG_2);
  });

  it("should insert two rows when the unlocked use case is called concurrently", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const deps = { persistence, profileId: PROFILE_ID, newId: sequentialNewId };

    // Act
    await Promise.all([
      saveManualHealthMetric(deps, {
        metric: "weight",
        day: DAY,
        value: SAMPLE_WEIGHT_KG,
      }),
      saveManualHealthMetric(deps, {
        metric: "weight",
        day: DAY,
        value: SAMPLE_WEIGHT_KG_2,
      }),
    ]);

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(2);
  });

  it.each(["tanita-bridge", "train2go-bridge"])(
    "should keep the day's %s weigh-in and write its own manual row",
    async (sourceBridgeId) => {
      // Arrange
      const persistence = createInMemoryPersistence();
      await persistence.healthWeight.put({
        id: "bridge-1",
        profileId: PROFILE_ID,
        date: DAY,
        sourceBridgeId,
        externalId: "bridge-hash",
        krd: {
          kind: "weight",
          version: "2.0",
          measuredAt: `${DAY}T08:00:00.000Z`,
          weightKilograms: SAMPLE_WEIGHT_KG,
        },
      });

      // Act
      const result = await saveManualHealthMetric(
        { persistence, profileId: PROFILE_ID, newId: () => "manual-1" },
        { metric: "weight", day: DAY, value: SAMPLE_WEIGHT_KG_2 }
      );

      // Assert
      const rows = await persistence.healthWeight.getByProfileAndDateRange(
        PROFILE_ID,
        DAY,
        DAY
      );
      expect(result?.recordId).toBe("manual-1");
      expect(
        rows.map((r) => [r.id, r.sourceBridgeId, r.krd.weightKilograms]).sort()
      ).toEqual([
        ["bridge-1", sourceBridgeId, SAMPLE_WEIGHT_KG],
        ["manual-1", "manual", SAMPLE_WEIGHT_KG_2],
      ]);
    }
  );

  describe("the weigh-in's measurement time", () => {
    const NOW = "2026-05-23T09:41:00.000Z";

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(NOW));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should stamp today's weigh-in with the real time it was entered", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const today = todayIsoDate();

      // Act
      await saveManualHealthMetric(
        { persistence, profileId: PROFILE_ID },
        { metric: "weight", day: today, value: SAMPLE_WEIGHT_KG }
      );

      // Assert
      const rows = await persistence.healthWeight.getByProfileAndDateRange(
        PROFILE_ID,
        today,
        today
      );
      expect(rows[0]?.krd.measuredAt).toBe(NOW);
    });

    it("should stamp a past day's weigh-in at noon of that day", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const pastDay = "2026-05-01";

      // Act
      await saveManualHealthMetric(
        { persistence, profileId: PROFILE_ID },
        { metric: "weight", day: pastDay, value: SAMPLE_WEIGHT_KG }
      );

      // Assert
      const rows = await persistence.healthWeight.getByProfileAndDateRange(
        PROFILE_ID,
        pastDay,
        pastDay
      );
      expect(rows[0]?.krd.measuredAt).toBe(`${pastDay}T12:00:00.000Z`);
    });
  });

  it("should leave an imported daily row untouched when steps are entered by hand", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const imported = {
      id: "imported-daily",
      profileId: PROFILE_ID,
      date: DAY,
      sourceBridgeId: "fit-import",
      externalId: "fit-daily-1",
      krd: priorDaily(),
    };
    await persistence.healthDaily.put(imported);

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID, newId: () => "manual-daily" },
      { metric: "daily-wellness", day: DAY, value: NEW_STEPS }
    );

    // Assert
    const rows = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.id === "imported-daily")).toEqual(imported);
    const manual = rows.find((r) => r.id === "manual-daily");
    expect(manual?.sourceBridgeId).toBe("manual");
    expect(manual?.krd.steps).toBe(NEW_STEPS);
  });

  it("should update the day's manual steps row when steps are saved again", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put({
      id: "imported-daily",
      profileId: PROFILE_ID,
      date: DAY,
      sourceBridgeId: "fit-import",
      krd: priorDaily(),
    });
    const deps = { persistence, profileId: PROFILE_ID, newId: sequentialNewId };
    const first = await saveManualHealthMetric(deps, {
      metric: "daily-wellness",
      day: DAY,
      value: PRIOR_STEPS,
    });

    // Act
    const second = await saveManualHealthMetric(deps, {
      metric: "daily-wellness",
      day: DAY,
      value: NEW_STEPS,
    });

    // Assert
    const rows = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    const manual = rows.filter((r) => r.sourceBridgeId === "manual");
    expect(second?.recordId).toBe(first?.recordId);
    expect(manual).toHaveLength(1);
    expect(manual[0]?.krd.steps).toBe(NEW_STEPS);
    expect(rows).toHaveLength(2);
  });

  it("should keep the calories of a legacy manual row when steps are saved again", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put({
      id: "legacy-daily",
      profileId: PROFILE_ID,
      date: DAY,
      sourceBridgeId: "manual",
      krd: priorDaily(),
    });

    // Act
    const result = await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "daily-wellness", day: DAY, value: NEW_STEPS }
    );

    // Assert
    const rows = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(result?.recordId).toBe("legacy-daily");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.krd).toEqual({ ...priorDaily(), steps: NEW_STEPS });
  });

  it("should store only the entered steps in the manual daily row", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "daily-wellness", day: DAY, value: NEW_STEPS }
    );

    // Assert
    const rows = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.krd).toEqual({
      kind: "daily",
      version: "2.0",
      date: DAY,
      steps: NEW_STEPS,
    });
  });

  it("should persist a valid in-range sleep score", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "sleep", day: DAY, sleep: { score: SAMPLE_SLEEP_SCORE } }
    );

    // Assert
    const rows = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.krd.score).toBe(SAMPLE_SLEEP_SCORE);
    expect(rows[0]?.krd).not.toHaveProperty("totalDurationSeconds");
  });

  it("should persist the hours slept as the sleep duration", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "sleep", day: DAY, sleep: { durationSeconds: SEVEN_THIRTY } }
    );

    // Assert
    const rows = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.krd.totalDurationSeconds).toBe(SEVEN_THIRTY);
  });

  it("should set hrv measurementWindow to a valid enum value", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "hrv", day: DAY, value: SAMPLE_RMSSD }
    );

    // Assert
    const rows = await persistence.healthHrv.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.krd.measurementWindow).toBe("spot");
  });

  it("should not write when the value is non-finite", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: Number.NaN }
    );

    // Assert
    expect(result).toBeUndefined();
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(0);
  });

  it.each([{ value: 150 }, { value: 88.5 }])(
    "should not persist an invalid sleep score ($value)",
    async ({ value }) => {
      // Arrange
      const persistence = createInMemoryPersistence();

      // Act
      const result = await saveManualHealthMetric(
        { persistence, profileId: PROFILE_ID },
        { metric: "sleep", day: DAY, sleep: { score: value } }
      );

      // Assert
      expect(result).toBeUndefined();
      const rows = await persistence.healthSleep.getByProfileAndDateRange(
        PROFILE_ID,
        DAY,
        DAY
      );
      expect(rows).toHaveLength(0);
    }
  );
});
