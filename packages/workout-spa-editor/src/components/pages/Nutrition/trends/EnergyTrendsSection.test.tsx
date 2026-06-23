import "fake-indexeddb/auto";

import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../../test-utils";
import type { HealthWeightRecord } from "../../../../types/health/health-records";
import { EnergyTrendsSection } from "./EnergyTrendsSection";

vi.mock("../../health/trends/UplotChart", () => ({
  UplotChart: () => <div data-testid="uplot-chart-mock" />,
}));

const PROFILE_ID = "p1";
const DATE = "2026-06-21";
const KG_80 = 80;
const KG_795 = 79.5;

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

const clearAll = () =>
  Promise.all([
    db.table("profiles").clear(),
    db.table("healthWeight").clear(),
    db.table("healthDaily").clear(),
    db.table("healthSleep").clear(),
    db.table("workouts").clear(),
    db.table("energyTargets").clear(),
  ]);

const renderSection = () =>
  renderWithProviders(
    <EnergyTrendsSection profileId={PROFILE_ID} date={DATE} />,
    { persistence: createDexiePersistence(db) }
  );

describe("EnergyTrendsSection", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should prompt for weigh-ins when no weight history exists", async () => {
    // Arrange
    await seedProfile();

    // Act
    renderSection();

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("energy-trends-empty")).toBeInTheDocument()
    );
  });

  it("should render the chart once weigh-ins exist", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await seedProfile();
    await persistence.healthWeight.put(weight("2026-06-19", KG_80));
    await persistence.healthWeight.put(weight("2026-06-20", KG_795));

    // Act
    renderSection();

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("energy-trend-chart")).toBeInTheDocument()
    );
  });
});
