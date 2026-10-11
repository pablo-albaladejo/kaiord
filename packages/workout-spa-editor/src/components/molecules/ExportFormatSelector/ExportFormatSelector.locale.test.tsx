import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { KRD } from "../../../types/krd";
import { ExportFormatSelector } from "./ExportFormatSelector";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const workout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-10-11T08:00:00Z", sport: "running" },
};

describe("ExportFormatSelector in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name the control, describe each format and warn in Spanish", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ExportFormatSelector
        currentFormat="krd"
        onFormatChange={vi.fn()}
        workout={workout}
      />
    );

    // Act
    await user.click(
      screen.getByRole("button", { name: "Seleccionar formato de exportación" })
    );

    // Assert
    const fit = screen.getByTestId("export-format-option-fit");
    expect(
      within(fit).getByText(
        "Formato FIT de Garmin: binario, para dispositivos de entrenamiento"
      )
    ).toBeVisible();
    expect(
      within(fit).getByText(
        "Puede que el formato FIT no admita todas las funciones del entreno"
      )
    ).toBeVisible();
  });

  it("should say in Spanish why a workout cannot be exported", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ExportFormatSelector currentFormat="krd" onFormatChange={vi.fn()} />
    );

    // Act
    await user.click(
      screen.getByRole("button", { name: "Seleccionar formato de exportación" })
    );
    await user.click(screen.getByTestId("export-format-option-krd"));

    // Assert
    expect(
      screen.getByText("No se puede exportar el entreno estructurado:")
    ).toBeVisible();
    expect(
      screen.getByText("workout: No hay ningún entreno que exportar")
    ).toBeVisible();
  });
});
