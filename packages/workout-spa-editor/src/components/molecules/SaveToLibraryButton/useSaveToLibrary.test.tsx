import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { addTemplate } from "../../../application/library/add-template";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { KRD } from "../../../types/krd";
import { useSaveToLibrary } from "./useSaveToLibrary";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../../../contexts/ToastContext", () => ({
  useToastContext: () => toast,
}));
vi.mock("../../../application/library/add-template", () => ({
  addTemplate: vi.fn(),
}));
vi.mock("./generate-thumbnail", () => ({
  generateThumbnail: vi.fn().mockResolvedValue("data:image/png;base64,x"),
}));

const KRD_FIXTURE: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Tempo", sport: "cycling", steps: [] },
  },
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

describe("useSaveToLibrary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("should word a failed save from the dictionary, never the storage error's text", async () => {
    // Arrange
    vi.mocked(addTemplate).mockRejectedValue(
      new Error("ConstraintError: internal storage detail")
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(
      () => useSaveToLibrary(KRD_FIXTURE, vi.fn(), true),
      { wrapper }
    );

    // Act
    await act(async () => {
      await result.current.handleSave();
    });

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "Save Failed",
      "The workout was not saved as a template. Try again.",
      { duration: 5000 }
    );
  });
});
