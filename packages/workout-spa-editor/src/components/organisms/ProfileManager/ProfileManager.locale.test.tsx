import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { Profile } from "../../../types/profile";
import { CreateProfileSection } from "./components/CreateProfileSection";
import { ProfileItemActions } from "./components/ProfileItemActions";
import { ProfileListSection } from "./components/ProfileListSection";
import { RowInfo } from "./components/RowInfo";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ImportExportActions } from "./ImportExportActions";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const profile = { id: "p1", name: "Mi perfil" } as Profile;
const noop = () => {};
const actions = {
  onSwitch: noop,
  onEdit: noop,
  onExport: noop,
  onDelete: noop,
};

describe("ProfileManager in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should ask to confirm a delete in Spanish", () => {
    // Arrange

    // Act
    render(<DeleteConfirmDialog open onConfirm={noop} onCancel={noop} />);

    // Assert
    expect(screen.getByText("Eliminar perfil")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeVisible();
  });

  it("should label the profile actions in Spanish", () => {
    // Arrange

    // Act
    render(
      <ProfileItemActions
        profile={profile}
        isActive={false}
        canDelete
        {...actions}
      />
    );

    // Assert
    expect(screen.getByRole("button", { name: "Activar" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Exportar perfil" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Eliminar perfil" })
    ).toBeVisible();
  });

  it("should name the import, create and list controls in Spanish", () => {
    // Arrange

    // Act
    render(
      <>
        <ImportExportActions onImport={noop} />
        <CreateProfileSection
          formData={{ name: "" }}
          setFormData={noop}
          onCreate={noop}
        />
        <ProfileListSection profiles={[]} activeProfileId={null} {...actions} />
      </>
    );

    // Assert
    expect(screen.getByLabelText("Importar archivo de perfil")).toBeTruthy();
    expect(screen.getByPlaceholderText("Nombre del nuevo perfil")).toBeTruthy();
    expect(screen.getByText("Perfiles guardados (0)")).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay perfiles. Crea uno para empezar.")
    ).toBeInTheDocument();
  });

  it("should say a coaching account is not connected in Spanish", () => {
    // Arrange

    // Act
    render(<RowInfo label="Train2Go" linked={undefined} />);

    // Assert
    expect(screen.getByText("Sin conectar")).toBeInTheDocument();
  });
});
