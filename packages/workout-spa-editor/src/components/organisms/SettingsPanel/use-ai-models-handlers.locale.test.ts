import { renderHook } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { useAiModelsHandlers } from "./use-ai-models-handlers";

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
vi.mock("../../../application/ai/set-model-binding", () => ({
  setModelBinding: () => Promise.reject(new Error("offline")),
}));
vi.mock("../../../application/ai/clear-model-binding", () => ({
  clearModelBinding: () => Promise.reject(new Error("offline")),
}));

describe("useAiModelsHandlers toasts in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should report failing to set or reset a model in Spanish", async () => {
    // Arrange
    const { result } = renderHook(() => useAiModelsHandlers());

    // Act
    result.current.onSetBinding({
      profileId: "p1",
      purpose: "chat",
      providerId: "x",
    } as never);
    result.current.onClearBinding("p1", "chat");

    // Assert
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo establecer el modelo. Inténtalo de nuevo."
      );
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo restablecer el modelo. Inténtalo de nuevo."
      );
    });
  });
});
