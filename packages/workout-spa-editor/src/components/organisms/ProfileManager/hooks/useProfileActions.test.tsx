/**
 * useProfileActions orchestrator hook tests.
 *
 * Verifies the hook merges CRUD + switch handlers into a single
 * surface and that handler invocation drives the underlying
 * PersistencePort. Per-handler edge cases are covered in the leaf
 * hook test files.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { makeProfile } from "../../../../application/profile/test-fixtures";
import { PersistenceProvider } from "../../../../contexts/persistence-context";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../../types/profile";
import { useProfileActions } from "./useProfileActions";

vi.mock("../../../../contexts/ToastContext", () => ({
  useToastContext: () => ({ error: vi.fn() }),
}));

const wrap = (persistence: PersistencePort) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  return Wrapper;
};

const PROFILE: Profile = makeProfile({
  id: "00000000-0000-4000-8000-0000000000c1",
  name: "Switcher",
});

describe("useProfileActions", () => {
  it("should expose every CRUD and switch handler in the returned shape", () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const { result } = renderHook(
      () =>
        useProfileActions({
          profiles: [],
          formData: { name: "" },
          editingProfile: null,
          setFormData: vi.fn(),
          setEditingProfile: vi.fn(),
          setDeleteConfirmId: vi.fn(),
          setSwitchNotification: vi.fn(),
        }),
      { wrapper: wrap(persistence) }
    );

    // Assert
    expect(typeof result.current.handleCreate).toBe("function");
    expect(typeof result.current.handleEdit).toBe("function");
    expect(typeof result.current.handleSave).toBe("function");
    expect(typeof result.current.handleCancel).toBe("function");
    expect(typeof result.current.handleDelete).toBe("function");
    expect(typeof result.current.confirmDelete).toBe("function");
    expect(typeof result.current.handleSwitchProfile).toBe("function");
  });

  it("should set the active profile when handleSwitchProfile finds a match", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(PROFILE);
    const setSwitchNotification = vi.fn();

    const { result } = renderHook(
      () =>
        useProfileActions({
          profiles: [PROFILE],
          formData: { name: "" },
          editingProfile: null,
          setFormData: vi.fn(),
          setEditingProfile: vi.fn(),
          setDeleteConfirmId: vi.fn(),
          setSwitchNotification,
        }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleSwitchProfile(PROFILE.id);
    });

    // Assert
    await waitFor(async () => {
      expect(await persistence.profiles.getActiveId()).toBe(PROFILE.id);
    });
    expect(setSwitchNotification).toHaveBeenCalledWith(
      "Switched to profile: Switcher"
    );
  });

  it("should propagate handleDelete to setDeleteConfirmId", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const setDeleteConfirmId = vi.fn();

    const { result } = renderHook(
      () =>
        useProfileActions({
          profiles: [],
          formData: { name: "" },
          editingProfile: null,
          setFormData: vi.fn(),
          setEditingProfile: vi.fn(),
          setDeleteConfirmId,
          setSwitchNotification: vi.fn(),
        }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleDelete("p-99");
    });

    // Assert
    expect(setDeleteConfirmId).toHaveBeenCalledWith("p-99");
  });
});
