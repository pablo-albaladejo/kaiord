import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { syncedAccount } from "../../../lib/athlete/test-profile";
import { renderWithProviders } from "../../../test-utils";
import type { IntegrationPolicy } from "../../../types/integration-policy";
import type { Profile } from "../../../types/profile";
import AthletePage from "./AthletePage";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const POLICY_ID = "22222222-2222-2222-2222-222222222222";
const FTP = 268;
const MAX_HR = 186;
const RECORDED_MAX_HR = 191;
const SYNCED_AT = "2026-07-12T00:00:00.000Z";

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: PROFILE_ID,
  name: "Ana Gomez",
  maxHeartRate: MAX_HR,
  sportZones: {
    cycling: {
      thresholds: { ftp: FTP },
      heartRateZones: { method: "karvonen-5", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: SYNCED_AT,
  ...overrides,
});

const AUTO_POLICY: IntegrationPolicy = {
  id: POLICY_ID,
  profileId: PROFILE_ID,
  dataType: "training-zones",
  bridgeId: "train2go-bridge",
  direction: "import",
  mode: "auto",
  enabled: true,
  updatedAt: SYNCED_AT,
};

async function seed(row: Profile): Promise<void> {
  await db.table<Profile>("profiles").put(row);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
}

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

describe("AthletePage provenance", () => {
  beforeEach(clearTables);
  afterEach(clearTables);

  it("should name the source a threshold came from", async () => {
    // Arrange
    await seed(
      profile({
        linkedAccounts: [
          syncedAccount("train2go", SYNCED_AT, { cyclingFtp: FTP }),
        ],
      })
    );

    // Act
    renderPage();

    // Assert
    const synced = await screen.findAllByText(/^Train2Go · /);
    expect(synced).toHaveLength(1);
  });

  it("should report a threshold no source sent as entered by hand", async () => {
    // Arrange
    await seed(profile());

    // Act
    renderPage();

    // Assert
    const byHand = await screen.findAllByText("By hand");
    expect(byHand).toHaveLength(2);
    expect(screen.queryByText(/Train2Go/)).not.toBeInTheDocument();
  });

  it("should offer the source's number as the fix when the two disagree", async () => {
    // Arrange
    await seed(
      profile({
        linkedAccounts: [
          syncedAccount("train2go", SYNCED_AT, {
            cyclingFtp: FTP,
            maxHeartRate: RECORDED_MAX_HR,
          }),
        ],
      })
    );

    // Act
    renderPage();

    // Assert
    expect(
      await screen.findByRole("button", { name: "Use 191" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep 186" })
    ).toBeInTheDocument();
  });

  it("should write the source's number when the fix is taken", async () => {
    // Arrange
    await seed(
      profile({
        linkedAccounts: [
          syncedAccount("train2go", SYNCED_AT, {
            cyclingFtp: FTP,
            maxHeartRate: RECORDED_MAX_HR,
          }),
        ],
      })
    );
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(await screen.findByRole("button", { name: "Use 191" }));

    // Assert
    await waitFor(async () => {
      const stored = await db.table<Profile>("profiles").get(PROFILE_ID);
      expect(stored?.maxHeartRate).toBe(RECORDED_MAX_HR);
    });
  });

  it("should render no auto-import control when no policy governs zones", async () => {
    // Arrange
    await seed(profile());

    // Act
    renderPage();

    // Assert
    await screen.findByText("Ana Gomez");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should switch the training-zones policy to manual when auto is turned off", async () => {
    // Arrange
    await seed(profile());
    await db.table("integrationPolicies").put(AUTO_POLICY);
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(await screen.findByRole("switch"));

    // Assert
    await waitFor(async () => {
      const stored = await db
        .table<IntegrationPolicy>("integrationPolicies")
        .get(POLICY_ID);
      expect(stored).toMatchObject({ mode: "manual", enabled: true });
    });
  });
});
