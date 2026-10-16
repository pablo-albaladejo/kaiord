import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { SyncTab } from "./SyncTab";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const sync = vi.hoisted(() => ({
  connected: false,
  status: "idle",
  lastSyncedAt: null,
  connect: vi.fn(),
  syncNow: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));
vi.mock("../../../contexts/ToastContext", () => ({
  useToastContext: () => toast,
}));
vi.mock("../../../contexts/sync-context", () => ({ useSync: () => sync }));
vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => [],
}));
vi.mock("./EncryptionSection", () => ({ EncryptionSection: () => null }));

describe("SyncTab toasts in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should report a failed Google connection in Spanish", async () => {
    // Arrange
    sync.connected = false;
    sync.connect.mockRejectedValue(new Error("popup closed"));
    const user = userEvent.setup();
    render(<SyncTab />);

    // Act
    await user.click(screen.getByRole("button", { name: /conectar/i }));

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "No se pudo conectar la cuenta de Google. Inténtalo de nuevo."
    );
  });

  it.each([
    ["synced", "success", "Sincronización completada."],
    [
      "failed",
      "error",
      "La sincronización falló. Tus datos están a salvo en este dispositivo.",
    ],
  ] as const)(
    "should word a %s sync in Spanish",
    async (outcome, kind, message) => {
      // Arrange
      sync.connected = true;
      sync.syncNow.mockResolvedValue(outcome);
      const user = userEvent.setup();
      render(<SyncTab />);

      // Act
      await user.click(screen.getByRole("button", { name: /sincronizar/i }));

      // Assert
      expect(toast[kind]).toHaveBeenCalledWith(message);
    }
  );
});
