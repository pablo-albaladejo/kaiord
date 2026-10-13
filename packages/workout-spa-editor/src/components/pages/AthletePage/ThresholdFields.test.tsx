import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import AthletePage from "./AthletePage";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const FTP = 250;
const NEW_FTP = 300;
const MAX_HR = 186;
const PACE_4_30 = 270;
const NEW_MAX_HR = 190;

const PROFILE: Profile = {
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
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const stored = () => db.table<Profile>("profiles").get(PROFILE_ID);

function renderPage() {
  const { hook } = memoryLocation({ path: "/athlete" });
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
  // The active sport is persisted; a Running left by one case would switch
  // the next case's page under its typing.
  await db.table("userPreferences").clear();
}

describe("Athlete thresholds, edited in place", () => {
  beforeEach(async () => {
    await clearTables();
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
  });
  afterEach(clearTables);

  it("should show the cycling thresholds as fields holding the stored values", async () => {
    // Arrange
    // Act
    renderPage();

    // Assert
    expect(await screen.findByLabelText("FTP (W)")).toHaveValue(FTP);
    expect(screen.getByLabelText("LTHR (bpm)")).toHaveValue(null);
    expect(screen.getByLabelText("Max Heart Rate (bpm)")).toHaveValue(MAX_HR);
  });

  it("should store a typed FTP on blur and say it was saved", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    const ftp = await screen.findByLabelText("FTP (W)");

    // Act
    await user.clear(ftp);
    await user.type(ftp, String(NEW_FTP));
    await user.tab();

    // Assert
    await waitFor(async () => {
      expect((await stored())?.sportZones.cycling?.thresholds.ftp).toBe(
        NEW_FTP
      );
    });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("should store a running threshold pace typed as minutes and seconds", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: "Running" }));

    // Act
    await user.type(
      await screen.findByLabelText("Threshold pace (min/km)"),
      "4:30{Enter}"
    );

    // Assert
    await waitFor(async () => {
      expect((await stored())?.sportZones.running?.thresholds).toMatchObject({
        thresholdPace: PACE_4_30,
        paceUnit: "min_per_km",
      });
    });
  });

  it("should reject a pace that is not minutes and seconds", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("radio", { name: "Running" }));

    // Act
    await user.type(
      await screen.findByLabelText("Threshold pace (min/km)"),
      "fast{Enter}"
    );

    // Assert
    expect(
      await screen.findByText("Use minutes and seconds, for example 4:30.")
    ).toBeInTheDocument();
    expect((await stored())?.sportZones.running).toBeUndefined();
  });

  it("should store the max heart rate as profile.maxHeartRate", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    const maxHr = await screen.findByLabelText("Max Heart Rate (bpm)");

    // Act
    await user.clear(maxHr);
    await user.type(maxHr, `${NEW_MAX_HR}{Enter}`);

    // Assert
    await waitFor(async () => {
      expect((await stored())?.maxHeartRate).toBe(NEW_MAX_HR);
    });
  });

  it("should reject a max heart rate above 250 instead of saving it", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    const maxHr = await screen.findByLabelText("Max Heart Rate (bpm)");

    // Act
    await user.clear(maxHr);
    await user.type(maxHr, "300{Enter}");

    // Assert
    expect(
      await screen.findByText("Enter a whole number between 1 and 250.")
    ).toBeInTheDocument();
    expect((await stored())?.maxHeartRate).toBe(MAX_HR);
  });

  it("should not open a thresholds dialog: the zones live on their own page", async () => {
    // Arrange
    // Act
    renderPage();

    // Assert
    const adjust = await screen.findByRole("link", { name: "Adjust zones" });
    expect(adjust).toHaveAttribute("href", "/athlete/zones/cycling");
    expect(
      screen.queryByRole("button", { name: "Edit" })
    ).not.toBeInTheDocument();
  });
});
