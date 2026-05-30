import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import AthletePage from "./AthletePage";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const CYCLING_FTP = 250;

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  sportZones: {
    cycling: {
      thresholds: { ftp: CYCLING_FTP },
      heartRateZones: { method: "karvonen-5", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function renderPage() {
  const { hook } = memoryLocation({ path: "/athlete", record: true });
  return renderWithProviders(
    <Router hook={hook}>
      <AthletePage />
    </Router>,
    { persistence: createDexiePersistence(db) }
  );
}

async function clearTables(): Promise<void> {
  await db.table("profiles").clear();
  await db.table("meta").clear();
  await db.table("integrationPolicies").clear();
}

describe("AthletePage", () => {
  beforeEach(clearTables);
  afterEach(clearTables);

  it("should render the route heading and the active profile name", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Athlete" })
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Ana Gomez")).toBeInTheDocument();
  });

  it("should render the empty state when no profile is active", async () => {
    // Arrange
    await db.table("meta").put({ key: "activeProfileId", value: null });

    // Act
    renderPage();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No athlete profile yet")).toBeInTheDocument();
    });
  });
});
