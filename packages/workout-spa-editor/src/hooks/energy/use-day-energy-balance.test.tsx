import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { useDayEnergyBalance } from "./use-day-energy-balance";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";
const INTAKE_KCAL = 1700;

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createDexiePersistence(db)}>
    {children}
  </PersistenceProvider>
);

const seedProfile = () =>
  db.table("profiles").put({
    id: PROFILE_ID,
    name: "Athlete",
    bodyWeight: 70,
    height: 178,
    birthDate: "1990-06-21",
    sex: "male",
    sportZones: {},
    linkedAccounts: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

const seedWellness = () =>
  db.table("healthDaily").put({
    id: "w1",
    profileId: PROFILE_ID,
    date: DATE,
    krd: {
      kind: "daily",
      version: "2.0",
      date: DATE,
      steps: 9000,
      activeCalories: 600,
      restingCalories: 1700,
      intensityMinutes: { moderate: 0, vigorous: 0 },
    },
  });

const clearAll = () =>
  Promise.all([
    db.table("profiles").clear(),
    db.table("healthDaily").clear(),
    db.table("intakeEntries").clear(),
  ]);

describe("useDayEnergyBalance", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should return undefined when profileId is null", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useDayEnergyBalance(null, DATE), {
      wrapper: wrap,
    });

    // Assert
    await waitFor(() => expect(result.current).toBeUndefined());
  });

  it("should resolve measured expenditure from seeded wellness", async () => {
    // Arrange
    await seedProfile();
    await seedWellness();

    // Act
    const { result } = renderHook(() => useDayEnergyBalance(PROFILE_ID, DATE), {
      wrapper: wrap,
    });

    // Assert
    await waitFor(() => expect(result.current).toBeDefined());
    const value = result.current!;
    expect(value.gated).toBe(false);
    if (value.gated) return;
    expect(value.balance.source).toBe("measured");
  });

  it("should re-evaluate when an intake entry is written", async () => {
    // Arrange
    await seedProfile();
    await seedWellness();
    const { result } = renderHook(() => useDayEnergyBalance(PROFILE_ID, DATE), {
      wrapper: wrap,
    });
    await waitFor(() => expect(result.current).toBeDefined());

    // Act
    await db.table("intakeEntries").put({
      id: "i1",
      profileId: PROFILE_ID,
      date: DATE,
      loggedAt: "2026-06-21T12:00:00.000Z",
      kcal: INTAKE_KCAL,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    });

    // Assert
    await waitFor(() => {
      const value = result.current!;
      expect(value.gated === false && value.balance.intake_kcal).toBe(
        INTAKE_KCAL
      );
    });
  });
});
