/**
 * Language and units describe the person reading the screen on this device,
 * not the athlete being managed (audit P-04). Switching the active profile
 * must leave both untouched, even when the newly active profile carries its
 * own legacy `units` / `locale` values from before they moved to the device.
 */

import "fake-indexeddb/auto";

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { useActiveProfileLive } from "../hooks/use-active-profile-live";
import { useUserPreferences } from "../hooks/use-user-preferences";
import { appI18n } from "../i18n/i18n";
import { LocaleProvider, useActiveLocale } from "../i18n/LocaleProvider";
import { UnitsProvider, useUnits } from "./units-context";

const NOW = "2026-10-12T10:00:00.000Z";

const seedProfile = async (
  id: string,
  prefs: { units: "metric" | "imperial"; locale: "en" | "es" }
) => {
  await db.table("profiles").put({
    id,
    name: id,
    linkedAccounts: [],
    sportZones: {},
    createdAt: NOW,
    updatedAt: NOW,
  });
  await db
    .table("userPreferences")
    .put({ profileId: id, calendarView: "grid", ...prefs, updatedAt: NOW });
};

const activate = (id: string) =>
  db.table("meta").put({ key: "activeProfileId", value: id });

const clearAll = async () => {
  for (const t of ["profiles", "meta", "userPreferences"]) {
    await db.table(t).clear();
  }
  localStorage.clear();
  await appI18n.changeLanguage("en");
};

// Reads the active profile's own row through the same live-query chain the
// providers used to follow, so once it shows p2's values every profile-keyed
// read has caught up with the switch.
const ProfileRowProbe = () => {
  const id = useActiveProfileLive()?.id ?? null;
  const prefs = useUserPreferences({ profileId: id, defaultView: "grid" });
  return <span data-testid="row">{`${id}:${prefs?.units ?? "-"}`}</span>;
};

const Probe = () => (
  <div>
    <ProfileRowProbe />
    <span data-testid="units">{useUnits()}</span>
    <span data-testid="locale">{useActiveLocale()}</span>
  </div>
);

describe("profile switch keeps the device preferences", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should keep units and language when another profile becomes active", async () => {
    // Arrange
    await seedProfile("p1", { units: "imperial", locale: "es" });
    await seedProfile("p2", { units: "metric", locale: "en" });
    await activate("p1");
    render(
      <LocaleProvider>
        <UnitsProvider>
          <Probe />
        </UnitsProvider>
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("units")).toHaveTextContent("imperial");
      expect(screen.getByTestId("locale")).toHaveTextContent("es");
    });

    // Act
    await activate("p2");
    await waitFor(() =>
      expect(screen.getByTestId("row")).toHaveTextContent("p2:metric")
    );

    // Assert
    expect(screen.getByTestId("units")).toHaveTextContent("imperial");
    expect(screen.getByTestId("locale")).toHaveTextContent("es");
  });
});
