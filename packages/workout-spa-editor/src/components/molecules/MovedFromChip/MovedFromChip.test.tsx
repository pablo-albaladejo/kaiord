/**
 * The local trace of an athlete move (design §3.13, AC-17): shown iff the
 * workout's date differs from the coach's, with the full sentence as its
 * accessible name in every density.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { coachWorkout } from "../../../application/session-move.test-fixtures";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { MovedFromChip } from "./MovedFromChip";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const moved = coachWorkout({ date: "2026-10-08", coachDate: "2026-10-06" });

describe("MovedFromChip", () => {
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should name the coach's day when the athlete moved the session", () => {
    // Arrange
    const workout = moved;

    // Act
    render(<MovedFromChip workout={workout} />);

    // Assert
    expect(
      screen.getByRole("img", { name: "Moved from Tue, Oct 6" })
    ).toHaveTextContent("Moved from Tue 6");
  });

  it("should keep the full sentence as the name of the compact chip", () => {
    // Arrange
    const workout = moved;

    // Act
    render(<MovedFromChip workout={workout} compact />);

    // Assert
    const chip = screen.getByRole("img", { name: "Moved from Tue, Oct 6" });
    expect(chip).toHaveTextContent(/^Tue 6$/);
  });

  it("should show nothing once the session is back on the coach's day", () => {
    // Arrange
    const workout = coachWorkout({
      date: "2026-10-06",
      coachDate: "2026-10-06",
    });

    // Act
    const { container } = render(<MovedFromChip workout={workout} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should show nothing for a workout the coach never built", () => {
    // Arrange
    const workout = coachWorkout({ coachDate: undefined });

    // Act
    const { container } = render(<MovedFromChip workout={workout} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should speak Spanish when the app does", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";

    // Act
    render(<MovedFromChip workout={moved} />);

    // Assert
    expect(
      screen.getByRole("img", { name: "Movida desde el mar, 6 oct" })
    ).toHaveTextContent("Movida desde el mar 6");
  });
});
