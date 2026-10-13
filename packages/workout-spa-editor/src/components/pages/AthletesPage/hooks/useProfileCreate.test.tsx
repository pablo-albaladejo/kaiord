/**
 * useProfileCreate hook tests.
 *
 * Drives the hook against an in-memory PersistencePort, asserting that
 * the create handler delegates to the application use case, clears the
 * form on success, and surfaces persistence rejections through the
 * toast context.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../../contexts/persistence-context";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { CreateFormData } from "./useProfileCreate";
import { useProfileCreate } from "./useProfileCreate";

const errorSpy = vi.fn();

vi.mock("../../../../contexts/ToastContext", () => ({
  useToastContext: () => ({ error: errorSpy }),
}));

const wrap = (persistence: PersistencePort) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  return Wrapper;
};

describe("useProfileCreate", () => {
  it("should create a profile when name is non-empty and clear the form", async () => {
    // Arrange
    errorSpy.mockReset();
    const persistence = createInMemoryPersistence();
    const setFormData = vi.fn();
    const formData: CreateFormData = { name: "Pablo" };

    const { result } = renderHook(
      () => useProfileCreate({ formData, setFormData }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleCreate();
    });

    // Assert
    await waitFor(async () => {
      const all = await persistence.profiles.getAll();
      expect(all).toHaveLength(1);
    });
    expect(setFormData).toHaveBeenCalledWith({ name: "" });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("should trim whitespace from the profile name before persisting", async () => {
    // Arrange
    errorSpy.mockReset();
    const persistence = createInMemoryPersistence();
    const setFormData = vi.fn();
    const formData: CreateFormData = { name: "   Athlete   " };

    const { result } = renderHook(
      () => useProfileCreate({ formData, setFormData }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleCreate();
    });

    // Assert
    await waitFor(async () => {
      const all = await persistence.profiles.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]?.name).toBe("Athlete");
    });
  });

  it("should do nothing when the name is blank or whitespace", async () => {
    // Arrange
    errorSpy.mockReset();
    const persistence = createInMemoryPersistence();
    const setFormData = vi.fn();
    const formData: CreateFormData = { name: "    " };

    const { result } = renderHook(
      () => useProfileCreate({ formData, setFormData }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleCreate();
    });

    // Assert
    expect(setFormData).not.toHaveBeenCalled();
    expect(await persistence.profiles.getAll()).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("should surface a toast error and skip form reset when persistence rejects", async () => {
    // Arrange
    errorSpy.mockReset();
    const persistence = createInMemoryPersistence();
    persistence.profiles.put = vi.fn(() =>
      Promise.reject(new Error("simulated"))
    );
    const setFormData = vi.fn();
    const formData: CreateFormData = { name: "Will Fail" };

    const { result } = renderHook(
      () => useProfileCreate({ formData, setFormData }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleCreate();
    });

    // Assert
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Couldn't create the athlete. Please try again."
      );
    });
    expect(setFormData).not.toHaveBeenCalled();
  });
});
