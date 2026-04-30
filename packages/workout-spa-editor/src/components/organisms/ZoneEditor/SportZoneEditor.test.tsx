/**
 * SportZoneEditor Component Tests
 *
 * Migrated to fake-indexeddb-backed Dexie + PersistenceProvider per
 * design D5.1. Test setup seeds the production Dexie singleton via
 * the application use cases so the live-hook reads under test resolve
 * the same way they would in production.
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { updateSportThresholds } from "../../../application/profile/zones/update-sport-thresholds";
import { renderWithProviders } from "../../../test-utils";
import type { Profile } from "../../../types/profile";
import { SportZoneEditor } from "./SportZoneEditor";

const renderEditor = (profileId: string) =>
  renderWithProviders(<SportZoneEditor profileId={profileId} />, {
    persistence: createDexiePersistence(db),
  });

const seedProfile = async (): Promise<Profile> => {
  const persistence = createDexiePersistence(db);
  const profile = await createProfile(persistence, "Test Athlete");
  await updateSportThresholds(persistence, profile.id, "cycling", {
    lthr: 180,
    ftp: 250,
  });
  const refreshed = await persistence.profiles.getById(profile.id);
  if (!refreshed) throw new Error("seed failed");
  return refreshed;
};

describe("SportZoneEditor", () => {
  beforeEach(async () => {
    localStorage.clear();
    await Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);
  });

  describe("rendering", () => {
    it("should render sport tabs", async () => {
      const profile = await seedProfile();

      renderEditor(profile.id);

      expect(
        await screen.findByRole("tab", { name: "Cycling" })
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Running" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Swimming" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Generic" })).toBeInTheDocument();
    });

    it("should default to cycling tab", async () => {
      const profile = await seedProfile();

      renderEditor(profile.id);

      expect(
        await screen.findByRole("tab", { name: "Cycling" })
      ).toHaveAttribute("aria-selected", "true");
    });

    it("should show HR zones section", async () => {
      const profile = await seedProfile();

      renderEditor(profile.id);

      expect(await screen.findByText("Heart Rate Zones")).toBeInTheDocument();
    });

    it("should show threshold inputs for cycling", async () => {
      const profile = await seedProfile();

      renderEditor(profile.id);

      expect(
        await screen.findByLabelText("LTHR threshold")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("FTP threshold")).toBeInTheDocument();
    });

    it("should show zone method dropdown", async () => {
      const profile = await seedProfile();

      renderEditor(profile.id);

      expect(
        await screen.findByLabelText("hr zone method")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("power zone method")).toBeInTheDocument();
    });
  });

  describe("tab switching", () => {
    it("should switch to running tab and show pace input", async () => {
      const profile = await seedProfile();
      const user = userEvent.setup();

      renderEditor(profile.id);

      await user.click(await screen.findByRole("tab", { name: "Running" }));

      expect(screen.getByRole("tab", { name: "Running" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(
        screen.getByLabelText("Threshold Pace threshold")
      ).toBeInTheDocument();
    });

    it("should switch to generic tab showing only HR zones", async () => {
      const profile = await seedProfile();
      const user = userEvent.setup();

      renderEditor(profile.id);

      await user.click(await screen.findByRole("tab", { name: "Generic" }));

      expect(screen.getByText("Heart Rate Zones")).toBeInTheDocument();
      expect(screen.queryByText("Power Zones")).not.toBeInTheDocument();
      expect(screen.queryByText("Pace Zones")).not.toBeInTheDocument();
    });
  });

  describe("zone method selection", () => {
    it("should change power zone method", async () => {
      const profile = await seedProfile();
      const user = userEvent.setup();
      const persistence = createDexiePersistence(db);

      renderEditor(profile.id);

      const methodSelect = await screen.findByLabelText("power zone method");
      await user.selectOptions(methodSelect, "british-cycling-6");

      // Wait for the use case write to land via Dexie.
      await vi.waitFor(async () => {
        const updated = await persistence.profiles.getById(profile.id);
        expect(updated?.sportZones?.cycling?.powerZones?.method).toBe(
          "british-cycling-6"
        );
      });
    });
  });

  describe("inline editing", () => {
    it("should edit zone name inline", async () => {
      const profile = await seedProfile();
      const user = userEvent.setup();
      const persistence = createDexiePersistence(db);

      renderEditor(profile.id);

      const nameButtons = await screen.findAllByLabelText("HR Zone 1 name");
      await user.click(nameButtons[0]);

      const input = screen.getByRole("textbox", { name: "HR Zone 1 name" });
      await user.clear(input);
      await user.type(input, "Easy");
      await user.keyboard("{Enter}");

      await vi.waitFor(async () => {
        const updated = await persistence.profiles.getById(profile.id);
        const hrZones = updated?.sportZones?.cycling?.heartRateZones?.zones;
        expect(hrZones?.[0].name).toBe("Easy");
      });
    });

    it("should render zone value buttons for editing", async () => {
      const profile = await seedProfile();

      renderEditor(profile.id);

      const minButtons = await screen.findAllByLabelText("HR Zone 1 min");
      expect(minButtons.length).toBeGreaterThan(0);

      const maxButtons = screen.getAllByLabelText("HR Zone 1 max");
      expect(maxButtons.length).toBeGreaterThan(0);
    });

    it("should show add zone button when method is custom", async () => {
      const profile = await seedProfile();
      const user = userEvent.setup();

      renderEditor(profile.id);

      const methodSelect = await screen.findByLabelText("power zone method");
      await user.selectOptions(methodSelect, "custom");

      expect((await screen.findAllByText("+ Add Zone")).length).toBeGreaterThan(
        0
      );
    });

    it("should show remove buttons when method is custom", async () => {
      const profile = await seedProfile();
      const user = userEvent.setup();

      renderEditor(profile.id);

      const methodSelect = await screen.findByLabelText("power zone method");
      await user.selectOptions(methodSelect, "custom");

      const removeButtons =
        await screen.findAllByLabelText(/Remove \w+ zone \d/);
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });
});
