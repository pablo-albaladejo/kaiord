import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { DayColumnAddButton } from "./DayColumnAddButton";
import { WeekNavigation } from "./WeekNavigation";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("calendar week controls in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should label the week navigation in Spanish", () => {
    // Arrange
    const { hook } = memoryLocation({ path: "/calendar/2026-W41" });

    // Act
    render(
      <Router hook={hook}>
        <WeekNavigation weekId="2026-W41" weekLabel="5 oct – 11 oct · S41" />
      </Router>
    );

    // Assert
    expect(
      screen.getByRole("button", { name: "Semana anterior" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Semana siguiente" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Hoy" })).toBeVisible();
  });

  it("should name the day it adds to in Spanish", () => {
    // Arrange
    const onAddClick = vi.fn();

    // Act
    render(<DayColumnAddButton date="2026-10-05" onAddClick={onAddClick} />);

    // Assert
    const button = screen.getByRole("button", { name: "Añadir a lun 5" });
    expect(button).toHaveTextContent("+ Añadir");
  });
});
