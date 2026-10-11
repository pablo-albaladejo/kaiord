import { renderHook } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { useAiTabHandlers } from "./use-ai-tab-handlers";

const toast = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));
vi.mock("../../../contexts/ToastContext", () => ({
  useToastContext: () => toast,
}));
vi.mock("../../../contexts/persistence-context", () => ({
  usePersistence: () => ({}),
}));
vi.mock("./save-with-key-check", () => ({
  saveWithKeyCheck: async () => "failed",
}));

describe("useAiTabHandlers in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should report a failed save in Spanish", async () => {
    // Arrange
    const { result } = renderHook(() => useAiTabHandlers());

    // Act
    await result.current.onAdd({ type: "openai", apiKey: "k", label: "L" });

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "No se pudo añadir el proveedor de IA. Inténtalo de nuevo."
    );
  });
});
