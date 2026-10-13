import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { renderWithProviders, screen, userEvent } from "../../../../test-utils";
import type { ProfileFormData } from "../types";
import { ProfileEditView } from "./ProfileEditView";

vi.mock("../../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("ProfileEditView in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should edit personal data entirely in Spanish", async () => {
    // Arrange
    const formData: ProfileFormData = { name: "Atleta" };
    renderWithProviders(
      <ProfileEditView
        formData={formData}
        onChange={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Act
    await userEvent.click(
      screen.getByRole("tab", { name: "Datos personales" })
    );

    // Assert
    expect(
      screen.queryByRole("tab", { name: "Zonas de entrenamiento" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Cuentas vinculadas" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Datos personales" })).toBeVisible();
    for (const label of [
      "Altura (cm)",
      "Fecha de nacimiento",
      "Frecuencia cardiaca en reposo (ppm)",
      "Sexo",
      "Nivel de actividad",
    ]) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
    expect(
      screen.getByRole("option", { name: "Muy activo" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mujer" })).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: "Sin indicar" })).toHaveLength(
      2
    );
  });
});
