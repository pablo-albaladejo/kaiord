import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../contexts/persistence-context";
import type { EnergyTargetRecord } from "../../types/energy-target-record";
import type { HealthWeightRecord } from "../../types/health/health-records";
import { useWeightTrend } from "./use-weight-trend";

const PROFILE_ID = "p1";
const RANGE = { start: "2026-06-01", end: "2026-06-30" };
const KG_80 = 80;
const KG_82 = 82;
const TARGET_KG = 75;

const weight = (date: string, kg: number): HealthWeightRecord => ({
  id: `w-${date}`,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    weightKilograms: kg,
  } as unknown as HealthWeightRecord["krd"],
});

const goal: EnergyTargetRecord = {
  profileId: PROFILE_ID,
  goalType: "fat_loss",
  startWeightKg: KG_80,
  targetWeightKg: TARGET_KG,
  targetDate: "2026-09-01",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const clear = () =>
  Promise.all([
    db.table("healthWeight").clear(),
    db.table("energyTargets").clear(),
  ]);

const wrapper = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createDexiePersistence(db)}>
    {children}
  </PersistenceProvider>
);

describe("useWeightTrend", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should expose raw weigh-ins and a smoothed trend of equal length", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthWeight.put(weight("2026-06-01", KG_80));
    await persistence.healthWeight.put(weight("2026-06-02", KG_82));

    // Act
    const { result } = renderHook(() => useWeightTrend(PROFILE_ID, RANGE), {
      wrapper,
    });

    // Assert
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current?.raw).toHaveLength(2);
    expect(result.current?.smoothed).toHaveLength(2);
    expect(result.current?.smoothed[0]?.value).toBe(KG_80);
  });

  it("should expose a goal target-weight line when a goal is active", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthWeight.put(weight("2026-06-01", KG_80));
    await persistence.energyTargets.put(goal);

    // Act
    const { result } = renderHook(() => useWeightTrend(PROFILE_ID, RANGE), {
      wrapper,
    });

    // Assert
    await waitFor(() =>
      expect(result.current?.goalLine?.[0]?.value).toBe(TARGET_KG)
    );
  });

  it("should return undefined when no profile is selected", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useWeightTrend(null, RANGE), {
      wrapper,
    });

    // Assert
    expect(result.current).toBeUndefined();
  });
});
