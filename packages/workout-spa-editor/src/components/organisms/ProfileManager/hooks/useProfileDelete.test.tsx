/**
 * useProfileDelete hook tests.
 *
 * Drives the delete + confirm flow against an in-memory PersistencePort.
 * Asserts the cascade fan-out runs through the injected persistence,
 * the row is gone after `confirmDelete`, and the confirm dialog stays
 * open when persistence rejects.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { makeProfile } from "../../../../application/profile/test-fixtures";
import { PersistenceProvider } from "../../../../contexts/persistence-context";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import { useProfileDelete } from "./useProfileDelete";

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

describe("useProfileDelete", () => {
  describe("handleDelete", () => {
    it("should record the candidate id without touching persistence", () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const setDeleteConfirmId = vi.fn();
      const deleteSpy = vi.spyOn(persistence.profiles, "delete");

      const { result } = renderHook(
        () => useProfileDelete({ setDeleteConfirmId }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.handleDelete("p-123");
      });

      // Assert
      expect(setDeleteConfirmId).toHaveBeenCalledWith("p-123");
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  describe("confirmDelete", () => {
    it("should remove the profile and clear the confirm id on success", async () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const profile = makeProfile({
        id: "00000000-0000-4000-8000-0000000000d2",
        name: "Doomed",
      });
      await persistence.profiles.put(profile);
      await persistence.profiles.setActiveId(profile.id);
      const setDeleteConfirmId = vi.fn();

      const { result } = renderHook(
        () => useProfileDelete({ setDeleteConfirmId }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.confirmDelete(profile.id);
      });

      // Assert
      await waitFor(async () => {
        expect(await persistence.profiles.getById(profile.id)).toBeUndefined();
      });
      expect(await persistence.profiles.getActiveId()).toBeNull();
      expect(setDeleteConfirmId).toHaveBeenCalledWith(null);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when no confirm id is provided", () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const setDeleteConfirmId = vi.fn();
      const deleteSpy = vi.spyOn(persistence.profiles, "delete");

      const { result } = renderHook(
        () => useProfileDelete({ setDeleteConfirmId }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.confirmDelete(null);
      });

      // Assert
      expect(deleteSpy).not.toHaveBeenCalled();
      expect(setDeleteConfirmId).not.toHaveBeenCalled();
    });

    it("should keep the confirm dialog open and surface a toast on persistence rejection", async () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const profile = makeProfile({
        id: "00000000-0000-4000-8000-0000000000d3",
        name: "Failure",
      });
      await persistence.profiles.put(profile);
      persistence.profiles.delete = vi.fn(() =>
        Promise.reject(new Error("simulated"))
      );
      const setDeleteConfirmId = vi.fn();

      const { result } = renderHook(
        () => useProfileDelete({ setDeleteConfirmId }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.confirmDelete(profile.id);
      });

      // Assert
      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          "Failed to delete profile — please retry."
        );
      });
      expect(setDeleteConfirmId).not.toHaveBeenCalledWith(null);
      // Profile row should still be present because the cascade rolled back.
      expect(await persistence.profiles.getById(profile.id)).toBeDefined();
    });
  });
});
