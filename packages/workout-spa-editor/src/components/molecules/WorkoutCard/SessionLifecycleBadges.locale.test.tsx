import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { SessionLifecycleBadges } from "./SessionLifecycleBadges";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("SessionLifecycleBadges in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name every lifecycle badge in Spanish", () => {
    // Arrange
    const flags = {
      fromCoach: true,
      aiAssisted: true,
      pushedToGarmin: true,
      executedAndMatched: true,
    };

    // Act
    render(<SessionLifecycleBadges flags={flags} />);

    // Assert
    const names = screen
      .getAllByRole("img")
      .map((badge) => badge.getAttribute("aria-label"));
    expect(names).toEqual([
      "Del plan del entrenador",
      "Asistido por IA",
      "Enviado a Garmin",
      "Realizado y emparejado",
    ]);
  });
});
