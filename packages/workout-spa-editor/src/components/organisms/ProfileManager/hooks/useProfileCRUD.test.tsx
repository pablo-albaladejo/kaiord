/**
 * useProfileCRUD orchestrator hook tests.
 *
 * Verifies the hook returns the merged shape of its three composed
 * leaf hooks (create, edit, delete) and that calling each handler
 * propagates through to the persistence port. Edge-case coverage of
 * the leaf hooks lives in their own test files.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { makeProfile } from "../../../../application/profile/test-fixtures";
import { PersistenceProvider } from "../../../../contexts/persistence-context";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import { useProfileCRUD } from "./useProfileCRUD";

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

describe("useProfileCRUD", () => {
  it("should expose handlers from create, edit, and delete leaf hooks", () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const { result } = renderHook(
      () =>
        useProfileCRUD({
          formData: { name: "" },
          editingProfile: null,
          setFormData: vi.fn(),
          setEditingProfile: vi.fn(),
          setDeleteConfirmId: vi.fn(),
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
  });

  it("should call setDeleteConfirmId when handleDelete fires", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const setDeleteConfirmId = vi.fn();

    const { result } = renderHook(
      () =>
        useProfileCRUD({
          formData: { name: "" },
          editingProfile: null,
          setFormData: vi.fn(),
          setEditingProfile: vi.fn(),
          setDeleteConfirmId,
        }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleDelete("p-77");
    });

    // Assert
    expect(setDeleteConfirmId).toHaveBeenCalledWith("p-77");
  });

  it("should populate the form when handleEdit is invoked", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const setFormData = vi.fn();
    const setEditingProfile = vi.fn();
    const profile = makeProfile({ name: "Pablo", bodyWeight: 70 });

    const { result } = renderHook(
      () =>
        useProfileCRUD({
          formData: { name: "" },
          editingProfile: null,
          setFormData,
          setEditingProfile,
          setDeleteConfirmId: vi.fn(),
        }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleEdit(profile);
    });

    // Assert
    expect(setEditingProfile).toHaveBeenCalledWith(profile);
    expect(setFormData).toHaveBeenCalledWith({
      name: "Pablo",
      bodyWeight: 70,
    });
  });

  it("should persist a new profile when handleCreate fires with a non-empty name", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const setFormData = vi.fn();

    const { result } = renderHook(
      () =>
        useProfileCRUD({
          formData: { name: "Sample" },
          editingProfile: null,
          setFormData,
          setEditingProfile: vi.fn(),
          setDeleteConfirmId: vi.fn(),
        }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => {
      result.current.handleCreate();
    });

    // Assert
    await waitFor(async () => {
      expect(await persistence.profiles.getAll()).toHaveLength(1);
    });
    expect(setFormData).toHaveBeenCalledWith({ name: "" });
  });
});
