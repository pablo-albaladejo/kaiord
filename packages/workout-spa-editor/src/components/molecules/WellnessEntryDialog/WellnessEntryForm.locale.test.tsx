import { afterEach, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { renderWithProviders, screen, userEvent } from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { WellnessEntryForm } from "./WellnessEntryForm";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

describe("WellnessEntryForm toasts", () => {
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should say in Spanish that a profile is needed when none is active", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";
    const persistence = createInMemoryPersistence();
    const user = userEvent.setup();
    renderWithProviders(
      <WellnessEntryForm date="2026-05-04" onSaved={vi.fn()} />,
      { persistence }
    );

    // Act
    await user.type(screen.getByLabelText("Peso (kg)"), "72");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    // Assert
    expect(
      await screen.findByText(
        "No hay perfil de atleta: selecciona o crea uno para guardar el bienestar"
      )
    ).toBeInTheDocument();
  });

  it("should confirm a save in Spanish", async () => {
    // Arrange
    await setActiveLocale("es");
    locale.active = "es";
    const persistence = createInMemoryPersistence();
    await persistence.profiles.setActiveId(
      "00000000-0000-4000-8000-0000000000a1"
    );
    const user = userEvent.setup();
    renderWithProviders(
      <WellnessEntryForm date="2026-05-04" onSaved={vi.fn()} />,
      { persistence }
    );

    // Act
    await user.type(screen.getByLabelText("Peso (kg)"), "72");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    // Assert
    expect(await screen.findByText("Bienestar guardado")).toBeInTheDocument();
  });
});
