import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GarminDateDrift } from "../../../application/garmin-placement/garmin-date-drift";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { GarminDriftProvider } from "./garmin-drift-context";
import { GarminDriftBadge } from "./GarminDriftBadge";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const renderBadge = (drift?: GarminDateDrift) =>
  render(
    <GarminDriftProvider value={new Map(drift ? [["w1", drift]] : [])}>
      <GarminDriftBadge workoutId="w1" />
    </GarminDriftProvider>
  );

describe("GarminDriftBadge", () => {
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should name the Garmin day of a placed workout", () => {
    // Arrange
    const drift = { placedOn: "2026-10-06", certainty: "placed" } as const;

    // Act
    renderBadge(drift);

    // Assert
    expect(
      screen.getByRole("img", { name: "Garmin still on Tue, Oct 6" })
    ).toHaveTextContent("Garmin: Tue 6");
  });

  it("should mark an unconfirmed placement as uncertain", () => {
    // Arrange
    const drift = { placedOn: "2026-10-06", certainty: "unconfirmed" } as const;

    // Act
    renderBadge(drift);

    // Assert
    expect(
      screen.getByRole("img", { name: "Garmin may still be on Tue, Oct 6" })
    ).toHaveTextContent("Garmin (?) Tue 6");
  });

  it("should render nothing for a workout without drift", () => {
    // Arrange
    const drift = undefined;

    // Act
    renderBadge(drift);

    // Assert
    expect(screen.queryByTestId("garmin-drift-badge")).toBeNull();
  });

  it("should render nothing outside a drift provider", () => {
    // Arrange
    const workoutId = "w1";

    // Act
    render(<GarminDriftBadge workoutId={workoutId} />);

    // Assert
    expect(screen.queryByTestId("garmin-drift-badge")).toBeNull();
  });

  it("should speak Spanish when the locale is es", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";
    const drift = { placedOn: "2026-10-06", certainty: "placed" } as const;

    // Act
    renderBadge(drift);

    // Assert
    expect(
      screen.getByRole("img", { name: "En Garmin sigue el mar, 6 oct" })
    ).toHaveTextContent("Garmin: mar 6");
  });
});
