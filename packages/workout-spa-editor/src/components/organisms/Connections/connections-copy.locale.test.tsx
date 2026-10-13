/* eslint-disable no-magic-numbers -- fixtures use literal measurement values for clarity */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { getTranslate } from "../../../i18n/use-translate";
import { sourceDisplayName } from "../../../lib/athlete/source-name";
import { buildDefaultZone } from "../ZoneEditor/utils/default-zone";
import { ApiKeyConnectForm } from "./ApiKeyConnectForm";
import { DisconnectConfirmation } from "./DisconnectConfirmation";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("connection copy in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should render the API key form in Spanish", () => {
    // Arrange
    const onConnect = vi.fn().mockRejectedValue("not an Error");

    // Act
    render(<ApiKeyConnectForm onConnect={onConnect} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Clave de API")).toBeVisible();
    expect(screen.getByRole("button", { name: "Conectar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeVisible();
  });

  it("should fall back to a Spanish message when the key is rejected without detail", async () => {
    // Arrange
    const onConnect = vi.fn().mockRejectedValue("nope");
    render(<ApiKeyConnectForm onConnect={onConnect} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Clave de API"), {
      target: { value: "k" },
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Conectar" }));

    // Assert
    expect(await screen.findByText("No se pudo conectar")).toBeVisible();
  });

  it("should confirm a disconnect in Spanish", () => {
    // Arrange

    // Act
    render(
      <DisconnectConfirmation
        isOpen
        message="Mensaje"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByRole("button", { name: "Desconectar" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeVisible();
  });

  it("should name manual entry in Spanish wherever a source is named", () => {
    // Arrange
    const t = getTranslate("connections", "es");

    // Act
    const name = sourceDisplayName("manual", t);

    // Assert
    expect(name).toBe("Entrada manual");
  });

  it("should name an added zone in the given language", () => {
    // Arrange
    const t = getTranslate("zones", "es");

    // Act
    const zone = buildDefaultZone(
      "powerZones",
      3,
      t("defaultName.zone_n", { n: 3 })
    );

    // Assert
    expect(zone).toMatchObject({ zone: 3, name: "Zona 3" });
  });
});
