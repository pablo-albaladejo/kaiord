import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import Daily from "./Daily";
import { toIsoDate } from "./today-dates";

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

  it("should show the health record's real source badge on the HRV stat (F3.2/F3.3 resolver wiring)", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
    const today = toIsoDate(new Date());
    await db.table("healthHrv").add({
      id: "hrv-1",
      profileId: PROFILE_ID,
      date: today,
      krd: {
        kind: "hrv",
        version: "2.0",
        measuredAt: `${today}T06:00:00.000Z`,
        rMSSD: 55,
        measurementWindow: "overnight",
      },
      sourceBridgeId: "whoop-bridge",
      externalId: "ext-1",
    });

    // Act
    renderPage();

    // Assert
    // The readiness card's HRV stat shows the record's real source,
    // resolved through resolveEffectiveSource rather than a direct
    // table read.
    await waitFor(() => {
      expect(screen.getByText("WHOOP")).toBeInTheDocument();
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
