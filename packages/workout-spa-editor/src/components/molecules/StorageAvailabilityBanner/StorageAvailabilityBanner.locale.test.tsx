import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { StorageAvailabilityBanner } from "./StorageAvailabilityBanner";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("StorageAvailabilityBanner in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should say storage is unavailable in Spanish", () => {
    // Arrange

    // Act
    render(<StorageAvailabilityBanner status="failed" />);

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Almacenamiento no disponible: los cambios de esta sesión no se guardarán"
    );
  });
});
