/**
 * ZoneIndicator Component Tests
 *
 * Reads via `useActiveProfileLive` (Dexie + useLiveQuery) per design
 * D5.1: production Dexie singleton, fake-indexeddb-backed in jsdom.
 * Seeds Dexie via the new application use cases so the assertions
 * exercise the same write paths as production code.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { updateSportThresholds } from "../../../application/profile/zones/update-sport-thresholds";
import { ZoneIndicator } from "./ZoneIndicator";

const clearProfileTables = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

describe("ZoneIndicator", () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearProfileTables();
  });

  it("should show setup hint when no profile is selected", async () => {
    render(<ZoneIndicator sport="" />);

    expect(await screen.findByText(/no profile selected/i)).toBeInTheDocument();
  });

  it("should show profile name when no sport is selected", async () => {
    const persistence = createDexiePersistence(db);
    await createProfile(persistence, "My Athlete");

    render(<ZoneIndicator sport="" />);

    expect(await screen.findByText(/my athlete/i)).toBeInTheDocument();
  });

  it("should show thresholds for selected sport", async () => {
    const persistence = createDexiePersistence(db);
    const profile = await createProfile(persistence, "Cyclist");
    await updateSportThresholds(persistence, profile.id, "cycling", {
      lthr: 175,
      ftp: 280,
    });

    render(<ZoneIndicator sport="cycling" />);

    expect(await screen.findByText(/cyclist/i)).toBeInTheDocument();
    expect(await screen.findByText(/LTHR: 175bpm/)).toBeInTheDocument();
    expect(await screen.findByText(/FTP: 280W/)).toBeInTheDocument();
  });

  it("should show profile name for unconfigured sport thresholds", async () => {
    const persistence = createDexiePersistence(db);
    await createProfile(persistence, "Runner");

    // All sports have a sportZones entry by default; without thresholds
    // the component falls back to "{name}" with no summary suffix.
    render(<ZoneIndicator sport="cycling" />);

    expect(await screen.findByText(/runner/i)).toBeInTheDocument();
  });
});
