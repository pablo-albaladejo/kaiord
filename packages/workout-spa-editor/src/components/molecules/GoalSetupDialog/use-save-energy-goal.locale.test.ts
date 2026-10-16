import { act, renderHook } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { GoalFormDraft } from "./goal-form-model";
import { useSaveEnergyGoal } from "./use-save-energy-goal";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const store = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));
vi.mock("../../../contexts/ToastContext", () => ({
  useToastContext: () => toast,
}));
vi.mock("../../../contexts/persistence-context", () => ({
  usePersistence: () => ({ energyTargets: store }),
}));

const draft: GoalFormDraft = {
  goalType: "fat_loss",
  startWeightKg: 72,
  targetWeightKg: 67,
  targetDate: "2026-12-21",
  overrideCap: false,
};

describe("useSaveEnergyGoal in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should confirm a saved goal in Spanish", async () => {
    // Arrange
    store.get.mockResolvedValue(undefined);
    store.put.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSaveEnergyGoal("p1"));

    // Act
    await act(() => result.current.submit(draft));

    // Assert
    expect(toast.success).toHaveBeenCalledWith("Objetivo guardado");
  });

  it("should report a failed save in Spanish", async () => {
    // Arrange
    store.get.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useSaveEnergyGoal("p1"));

    // Act
    await act(() => result.current.submit(draft));

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "No se pudo guardar el objetivo. Inténtalo de nuevo."
    );
  });
});
