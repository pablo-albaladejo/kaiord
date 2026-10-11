import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { PrivacyTab } from "./PrivacyTab";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));
vi.mock("../../../contexts/ToastContext", () => ({
  useToastContext: () => toast,
}));
vi.mock("../../../contexts/persistence-context", () => ({
  usePersistence: () => ({}),
}));
vi.mock("../../../application/ai/clear-all-providers", () => ({
  clearAllProviders: () => Promise.reject(new Error("quota")),
}));
vi.mock("./use-export-backup", () => ({ useExportBackup: () => vi.fn() }));
vi.mock("./BackupImportSection", () => ({ BackupImportSection: () => null }));

describe("PrivacyTab toasts in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should report failing to clear the API keys in Spanish", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PrivacyTab />);

    // Act
    await user.click(
      screen.getByRole("button", { name: "Borrar todas las claves de API" })
    );

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "No se pudieron borrar las claves de API. Inténtalo de nuevo."
    );
  });
});
