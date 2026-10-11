import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { renderWithProviders, screen, userEvent } from "../../../../test-utils";
import type { ProfileFormData } from "../types";
import { ProfileEditView } from "./ProfileEditView";

vi.mock("../../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const PROFILE_ID = "00000000-0000-4000-8000-0000000000a2";

describe("ProfileEditView in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should edit personal data entirely in Spanish", async () => {
    // Arrange
    const formData: ProfileFormData = { name: "Atleta" };
    renderWithProviders(
      <ProfileEditView
        profileId={PROFILE_ID}
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
      screen.getByRole("tab", { name: "Zonas de entrenamiento" })
    ).toBeVisible();
    expect(
      screen.getByRole("tab", { name: "Cuentas vinculadas" })
    ).toBeVisible();
    for (const label of [
      "Peso corporal (kg)",
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
