/**
 * Running thresholds the way a runner sets them: pace and LTHR first, power
 * optional, the method on screen being the one the zones were built with,
 * and a word once the change is stored.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { updateSportThresholds } from "../../../application/profile/zones/update-sport-thresholds";
import { updateSportZones } from "../../../application/profile/zones/update-sport-zones";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { renderWithProviders } from "../../../test-utils";
import { SportZoneEditor } from "./SportZoneEditor";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const LTHR = 170;
const NEW_LTHR = "172";

const persistence = () => createDexiePersistence(db);

const seedRunner = async (): Promise<string> => {
  const profile = await createProfile(persistence(), "Runner");
  await updateSportThresholds(persistence(), profile.id, "running", {
    lthr: LTHR,
  });
  return profile.id;
};

const renderRunning = (profileId: string) =>
  renderWithProviders(
    <SportZoneEditor profileId={profileId} initialSport="running" />,
    { persistence: persistence() }
  );

describe("SportZoneEditor for a runner", () => {
  beforeEach(async () => {
    localStorage.clear();
    await Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);
  });
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should lead with pace and LTHR and mark power optional", async () => {
    // Arrange
    const id = await seedRunner();

    // Act
    renderRunning(id);

    // Assert
    const lthr = await screen.findByLabelText("LTHR threshold");
    const inputs = screen.getAllByLabelText(/threshold$/);
    expect(inputs.map((input) => input.getAttribute("aria-label"))).toEqual([
      "Threshold Pace threshold",
      "LTHR threshold",
      "FTP threshold",
    ]);
    expect(lthr).toHaveValue(LTHR);
    expect(screen.getByTestId("threshold-optional-FTP")).toHaveTextContent(
      "optional"
    );
  });

  it("should show the method the heart-rate zones were built with", async () => {
    // Arrange
    const id = await seedRunner();

    // Act
    renderRunning(id);

    // Assert
    const select = await screen.findByLabelText("hr zone method");
    expect(select).toHaveDisplayValue("Karvonen 5-zone");
    expect(screen.getAllByLabelText(/^HR Zone \d max$/)[0]).toHaveTextContent(
      "139"
    );
  });

  it("should not dress the athlete's own zones up as a preset", async () => {
    // Arrange
    const id = await seedRunner();
    await updateSportZones(persistence(), id, "running", "heartRateZones", [
      { zone: 1, name: "Mine", minBpm: 100, maxBpm: 140 },
    ]);

    // Act
    renderRunning(id);

    // Assert
    expect(await screen.findByLabelText("hr zone method")).toHaveDisplayValue(
      "Your own zones"
    );
  });

  it("should say when a threshold change is stored", async () => {
    // Arrange
    const id = await seedRunner();
    const user = userEvent.setup();
    renderRunning(id);
    const lthr = await screen.findByLabelText("LTHR threshold");

    // Act
    await user.clear(lthr);
    await user.type(lthr, NEW_LTHR);

    // Assert
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
  });

  it("should name zones and methods in Spanish", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";
    const id = await seedRunner();

    // Act
    renderRunning(id);

    // Assert
    const select = await screen.findByLabelText("método de zona hr");
    expect(select).toHaveDisplayValue("Karvonen 5 zonas");
    const zone1 = screen.getAllByLabelText(/^FC Zona 1 nombre$/)[0];
    expect(within(zone1).getByText("Recuperación")).toBeInTheDocument();
  });
});
