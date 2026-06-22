import "fake-indexeddb/auto";

import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { EnergyBalanceCard } from "./EnergyBalanceCard";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";

const wrap = ({ children }: { children: ReactNode }) => (
  <Router hook={memoryLocation().hook}>
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      {children}
    </PersistenceProvider>
  </Router>
);

const fullProfile = {
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
};

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

const seedIntake = () =>
  db.table("intakeEntries").put({
    id: "i1",
    profileId: PROFILE_ID,
    date: DATE,
    loggedAt: "2026-06-21T12:00:00.000Z",
    kcal: 1700,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
  });

const clearAll = () =>
  Promise.all([
    db.table("profiles").clear(),
    db.table("healthDaily").clear(),
    db.table("intakeEntries").clear(),
  ]);

describe("EnergyBalanceCard", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should render the measured expenditure and net for a covered day", async () => {
    // Arrange
    await db.table("profiles").put(fullProfile);
    await seedWellness();
    await seedIntake();

    // Act
    render(<EnergyBalanceCard profileId={PROFILE_ID} date={DATE} />, {
      wrapper: wrap,
    });

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("energy-balance-card")).toBeInTheDocument()
    );
    expect(screen.getByText("Measured")).toBeInTheDocument();
    expect(screen.getByText("600 kcal deficit")).toBeInTheDocument();
  });

  it("should render the gated prompt when BMR inputs are missing", async () => {
    // Arrange
    await db.table("profiles").put({
      ...fullProfile,
      height: undefined,
      birthDate: undefined,
      sex: undefined,
    });

    // Act
    render(<EnergyBalanceCard profileId={PROFILE_ID} date={DATE} />, {
      wrapper: wrap,
    });

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("energy-balance-gated")).toBeInTheDocument()
    );
    expect(
      screen.getByText("Complete your profile to estimate energy")
    ).toBeInTheDocument();
  });
});
