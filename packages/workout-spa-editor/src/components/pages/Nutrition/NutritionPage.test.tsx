import "fake-indexeddb/auto";

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import NutritionPage from "./NutritionPage";

const PROFILE_ID = "p-nutrition";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Athlete",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const seedPreset = () =>
  db.table("intakePresets").put({
    id: "preset-1",
    profileId: PROFILE_ID,
    label: "Usual breakfast",
    kcal: 450,
    proteinG: 30,
    carbG: 50,
    fatG: 12,
    createdAt: "2026-01-01T00:00:00.000Z",
  });

function renderPage() {
  const { hook } = memoryLocation({ path: "/nutrition", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <NutritionPage />
    </Router>,
    { persistence: createDexiePersistence(db) }
  );
}

async function clearTables(): Promise<void> {
  await db.table("profiles").clear();
  await db.table("meta").clear();
  await db.table("intakeEntries").clear();
  await db.table("intakePresets").clear();
}

describe("NutritionPage", () => {
  beforeEach(clearTables);
  afterEach(clearTables);

  it("should render the route heading and the intake logger for an active profile", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderPage();

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("intake-logger")).toBeInTheDocument()
    );
    expect(
      screen.getByRole("heading", { name: "Nutrition" })
    ).toBeInTheDocument();
  });

  it("should render the empty state when no profile is active", async () => {
    // Arrange
    await db.table("meta").put({ key: "activeProfileId", value: null });

    // Act
    renderPage();

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("nutrition-empty")).toBeInTheDocument()
    );
  });

  it("should create a logged entry when a saved preset is applied", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
    await seedPreset();
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("intake-preset-apply")).toBeInTheDocument()
    );

    // Act
    await user.click(screen.getByTestId("intake-preset-apply"));

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("intake-entry-row")).toBeInTheDocument()
    );
    expect(screen.getByTestId("intake-entry-row")).toHaveTextContent(
      "Usual breakfast"
    );
  });
});
