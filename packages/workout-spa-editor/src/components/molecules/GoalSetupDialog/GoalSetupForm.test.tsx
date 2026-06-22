import "fake-indexeddb/auto";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { GoalSetupForm } from "./GoalSetupForm";

const PROFILE_ID = "p1";
const TODAY = "2026-06-21";
const TARGET_WEIGHT_KG = 67;

const wrap = ({ children }: { children: ReactNode }) => (
  <ToastContextProvider>
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      {children}
    </PersistenceProvider>
  </ToastContextProvider>
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

const clearAll = () =>
  Promise.all([
    db.table("profiles").clear(),
    db.table("energyTargets").clear(),
    db.table("healthWeight").clear(),
  ]);

describe("GoalSetupForm", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should persist an energy-target record on save", async () => {
    // Arrange
    await seedProfile();
    const user = userEvent.setup();
    render(
      <GoalSetupForm profileId={PROFILE_ID} today={TODAY} onSaved={() => {}} />,
      { wrapper: wrap }
    );
    await screen.findByLabelText("Target weight (kg)");

    // Act
    await user.clear(screen.getByLabelText("Target weight (kg)"));
    await user.type(screen.getByLabelText("Target weight (kg)"), "67");
    await user.type(screen.getByLabelText("Target date"), "2026-12-21");
    await user.click(screen.getByTestId("goal-save"));

    // Assert
    await waitFor(async () =>
      expect(await db.table("energyTargets").get(PROFILE_ID)).toBeDefined()
    );
    const saved = await db.table("energyTargets").get(PROFILE_ID);
    expect(saved.targetWeightKg).toBe(TARGET_WEIGHT_KG);
    expect(saved.goalType).toBe("fat_loss");
  });

  it("should show the cap warning for an aggressive goal", async () => {
    // Arrange
    await seedProfile();
    const user = userEvent.setup();
    render(
      <GoalSetupForm profileId={PROFILE_ID} today={TODAY} onSaved={() => {}} />,
      { wrapper: wrap }
    );
    await screen.findByLabelText("Target weight (kg)");

    // Act
    await user.type(screen.getByLabelText("Target weight (kg)"), "55");
    await user.type(screen.getByLabelText("Target date"), "2026-07-21");

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("goal-cap-warning")).toBeInTheDocument()
    );
  });

  it("should persist the override flag when the user overrides the cap", async () => {
    // Arrange
    await seedProfile();
    const user = userEvent.setup();
    render(
      <GoalSetupForm profileId={PROFILE_ID} today={TODAY} onSaved={() => {}} />,
      { wrapper: wrap }
    );
    await screen.findByLabelText("Target weight (kg)");
    await user.type(screen.getByLabelText("Target weight (kg)"), "55");
    await user.type(screen.getByLabelText("Target date"), "2026-07-21");
    await screen.findByTestId("goal-cap-override");

    // Act
    await user.click(screen.getByTestId("goal-cap-override"));
    await user.click(screen.getByTestId("goal-save"));

    // Assert
    await waitFor(async () =>
      expect(
        (await db.table("energyTargets").get(PROFILE_ID))?.overrideCap
      ).toBe(true)
    );
  });
});
