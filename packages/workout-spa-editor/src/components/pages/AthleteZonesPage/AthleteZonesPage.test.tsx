import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import AthleteZonesPage from "./AthleteZonesPage";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const FTP = 250;
const GENERIC_LTHR = 165;

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Ana Gomez",
  sportZones: {
    cycling: {
      thresholds: { ftp: FTP },
      heartRateZones: { method: "custom", zones: [] },
      powerZones: { method: "coggan-7", zones: [] },
    },
    running: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: [] },
    },
    generic: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function renderAt(path: string) {
  const location = memoryLocation({ path, record: true });
  renderWithProviders(
    <Router hook={location.hook}>
      <Route path="/athlete/zones/:sport" component={AthleteZonesPage} />
    </Router>,
    { persistence: createDexiePersistence(db) }
  );
  return location;
}

async function clearTables(): Promise<void> {
  await db.table("profiles").clear();
  await db.table("meta").clear();
}

describe("AthleteZonesPage", () => {
  beforeEach(async () => {
    await clearTables();
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
  });
  afterEach(clearTables);

  it("should open the zone editor on the sport in the URL", async () => {
    // Arrange
    // Act
    renderAt("/athlete/zones/running");

    // Assert
    expect(
      await screen.findByRole("heading", { level: 1, name: "Running zones" })
    ).toHaveAttribute("data-route-heading");
    expect(await screen.findByRole("tab", { name: "Running" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("link", { name: /Athlete/ })).toHaveAttribute(
      "href",
      "/athlete"
    );
  });

  it("should put the sport chosen in the editor in the URL", async () => {
    // Arrange
    const user = userEvent.setup();
    const location = renderAt("/athlete/zones/running");

    // Act
    await user.click(await screen.findByRole("tab", { name: "Cycling" }));

    // Assert
    await waitFor(() => {
      expect(location.history.at(-1)).toBe("/athlete/zones/cycling");
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Cycling zones" })
    ).toBeInTheDocument();
  });

  it("should send an unknown sport to the cycling zones", async () => {
    // Arrange
    // Act
    const location = renderAt("/athlete/zones/rowing");

    // Assert
    await waitFor(() => {
      expect(location.history.at(-1)).toBe("/athlete/zones/cycling");
    });
  });

  // Thresholds have one home: the Athlete page. Here they are stated, and
  // linked, but not edited.
  it("should state a sport's thresholds without editing them", async () => {
    // Arrange
    // Act
    renderAt("/athlete/zones/cycling");

    // Assert
    expect(await screen.findByText("Thresholds: FTP (W) 250")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Edit thresholds" })
    ).toHaveAttribute("href", "/athlete");
  });

  // The generic sport is not on the Athlete page, so its LTHR is edited here.
  it("should edit the generic LTHR in the zone editor", async () => {
    // Arrange
    const user = userEvent.setup();
    renderAt("/athlete/zones/generic");

    // Act
    await user.type(
      await screen.findByLabelText("LTHR (bpm)"),
      `${GENERIC_LTHR}{Enter}`
    );

    // Assert
    await waitFor(async () => {
      const stored = await db.table<Profile>("profiles").get(PROFILE_ID);
      expect(stored?.sportZones.generic?.thresholds.lthr).toBe(GENERIC_LTHR);
    });
  });
});
