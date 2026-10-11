/**
 * Real-Dexie component test: a user who never connects anything must still
 * be able to finish the checklist. Every write below is one a manual surface
 * makes (editor, threshold card, wellness dialog, save-to-library); no
 * connection, bridge or export-ledger row is ever seeded.
 */
import "fake-indexeddb/auto";

import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import { SetupChecklist } from "./SetupChecklist";

const PROFILE_ID = "66666666-6666-6666-6666-666666666666";

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "By Hand",
  sportZones: { running: { thresholds: { lthr: 170 } } },
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
} as Profile;

const TABLES = [
  "profiles",
  "meta",
  "workouts",
  "healthDaily",
  "templates",
  "userPreferences",
];

const clearTables = async () => {
  for (const table of TABLES) await db.table(table).clear();
};

const renderCard = () => {
  const { hook } = memoryLocation({ path: "/daily", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <SetupChecklist />
    </Router>
  );
};

describe("SetupChecklist without integrations", () => {
  beforeEach(async () => {
    await clearTables();
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
    await db
      .table("workouts")
      .put({ id: "w1", profileId: PROFILE_ID, date: "2026-10-10" });
    await db.table("healthDaily").put({
      id: "d1",
      profileId: PROFILE_ID,
      date: "2026-10-10",
    });
  });
  afterEach(clearTables);

  it("should count three of four manual steps before the library save", async () => {
    // Arrange

    // Act
    renderCard();

    // Assert
    expect(await screen.findByText("3 of 4 done")).toBeInTheDocument();
  });

  it("should reach 100% and step aside once the last manual step is done", async () => {
    // Arrange
    renderCard();
    await screen.findByText("3 of 4 done");

    // Act
    await db.table("templates").put({ id: "t1", sport: "running", tags: [] });

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId("setup-checklist")).not.toBeInTheDocument();
    });
    expect(await db.table("connections").count()).toBe(0);
    expect(await db.table("exportLedger").count()).toBe(0);
  });
});
