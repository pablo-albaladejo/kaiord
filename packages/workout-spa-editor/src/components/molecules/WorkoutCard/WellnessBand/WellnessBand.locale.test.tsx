import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { WellnessBand } from "./WellnessBand";

vi.mock("../../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const renderBand = (wellness: Parameters<typeof WellnessBand>[0]["wellness"]) =>
  render(
    <Router hook={memoryLocation({ path: "/calendar" }).hook}>
      <WellnessBand wellness={wellness} resolved />
    </Router>
  );

describe("WellnessBand in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name each wellness badge in Spanish", () => {
    // Arrange
    const wellness = { sleep: "7.5h", weight: "72.4", steps: "9000" };

    // Act
    renderBand(wellness);

    // Assert
    expect(screen.getByRole("link", { name: "Sueño 7.5h" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Peso 72.4" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Pasos 9000" })).toBeVisible();
  });

  it("should mark a day without data in Spanish", () => {
    // Arrange

    // Act
    renderBand(undefined);

    // Assert
    expect(
      screen.getByRole("img", { name: "Sin datos de preparación" })
    ).toBeInTheDocument();
  });
});
