import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import {
  openZonesOffer,
  rememberZonesOffer,
} from "../../../adapters/train2go/zones-offer-memo";
import { renderWithProviders } from "../../../test-utils";
import type { ConflictItem } from "../../../types/coaching-zones";
import type { Profile } from "../../../types/profile";
import { ZonesOfferRow } from "./ZonesOfferRow";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const OWN_FTP = 200;
const TRAIN2GO_FTP = 268;
const KEPT =
  "Train2Go has different thresholds from the ones you set. Kaiord kept yours.";
const FTP_DIFFERS: ConflictItem = {
  field: "cycling.thresholds.ftp",
  current: OWN_FTP,
  incoming: TRAIN2GO_FTP,
};

const profile = (ftp: number): Profile => ({
  id: PROFILE_ID,
  name: "Ana Gomez",
  sportZones: {
    cycling: {
      thresholds: { ftp },
      heartRateZones: { method: "karvonen-5", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
});

const storedFtp = async () =>
  (await db.table<Profile>("profiles").get(PROFILE_ID))?.sportZones.cycling
    ?.thresholds.ftp;

const renderRow = async (ftp: number) => {
  await db.table<Profile>("profiles").put(profile(ftp));
  return renderWithProviders(<ZonesOfferRow profile={profile(ftp)} />, {
    persistence: createDexiePersistence(db),
  });
};

describe("ZonesOfferRow", () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.table("profiles").clear();
  });
  afterEach(async () => {
    await db.table("profiles").clear();
  });

  it("should keep showing the offer after its notice is gone, naming what differs", async () => {
    // Arrange
    rememberZonesOffer(PROFILE_ID, [FTP_DIFFERS]);

    // Act
    await renderRow(OWN_FTP);

    // Assert
    expect(screen.getByText(KEPT)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use Train2Go's" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep mine" })).toBeVisible();
  });

  it("should write Train2Go's numbers and close the offer when the athlete uses them", async () => {
    // Arrange
    rememberZonesOffer(PROFILE_ID, [FTP_DIFFERS]);
    await renderRow(OWN_FTP);

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Use Train2Go's" })
    );

    // Assert
    await waitFor(async () => expect(await storedFtp()).toBe(TRAIN2GO_FTP));
    await waitFor(() => expect(screen.queryByText(KEPT)).toBeNull());
    expect(openZonesOffer(PROFILE_ID)).toEqual([]);
  });

  it("should close the offer and keep the athlete's numbers when they keep theirs", async () => {
    // Arrange
    rememberZonesOffer(PROFILE_ID, [FTP_DIFFERS]);
    await renderRow(OWN_FTP);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Keep mine" }));

    // Assert
    await waitFor(() => expect(screen.queryByText(KEPT)).toBeNull());
    expect(await storedFtp()).toBe(OWN_FTP);
    expect(openZonesOffer(PROFILE_ID)).toEqual([]);
  });

  it("should show nothing once the athlete's number already equals Train2Go's", async () => {
    // Arrange
    rememberZonesOffer(PROFILE_ID, [FTP_DIFFERS]);

    // Act
    await renderRow(TRAIN2GO_FTP);

    // Assert
    expect(screen.queryByText(KEPT)).toBeNull();
  });

  it("should show nothing when no offer is open", async () => {
    // Arrange
    // Act
    await renderRow(OWN_FTP);

    // Assert
    expect(screen.queryByText(KEPT)).toBeNull();
  });
});
