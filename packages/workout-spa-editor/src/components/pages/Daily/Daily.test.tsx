import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import Daily from "./Daily";

const PROFILE_ID = "22222222-2222-2222-2222-222222222222";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Sam Rider",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function renderPage() {
  const { hook } = memoryLocation({ path: "/calendar", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <Daily />
    </Router>,
    { persistence: createDexiePersistence(db) }
  );
}

async function clearTables(): Promise<void> {
  await db.table("profiles").clear();
  await db.table("meta").clear();
  await db.table("workouts").clear();
  await db.table("healthHrv").clear();
  await db.table("healthSleep").clear();
}

describe("Daily", () => {
  beforeEach(clearTables);
  afterEach(clearTables);

  it("should render the Today route heading", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Today" })
      ).toBeInTheDocument();
    });
  });

  it("should show the no-readiness state when health data is absent", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No readiness data yet")).toBeInTheDocument();
    });
  });

  it("should show the empty planned-session state with no workout today", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Nothing planned today")).toBeInTheDocument();
    });
  });
});
