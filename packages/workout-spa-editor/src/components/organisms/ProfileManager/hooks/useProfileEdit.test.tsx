/**
 * useProfileEdit hook tests.
 *
 * Covers the three handlers exposed by the hook (handleEdit, handleSave,
 * handleCancel) against an in-memory PersistencePort, including override
 * data on save, the no-op early-return paths, and toast surfacing on
 * persistence rejection.
 */
/* eslint-disable no-magic-numbers -- test fixtures use literal values for clarity */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { makeProfile } from "../../../../application/profile/test-fixtures";
import { PersistenceProvider } from "../../../../contexts/persistence-context";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";
import { useProfileEdit } from "./useProfileEdit";

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

const seededProfile = (overrides: Partial<Profile> = {}): Profile =>
  makeProfile({
    id: "00000000-0000-4000-8000-0000000000a1",
    name: "Original",
    bodyWeight: 70,
    ...overrides,
  });

describe("useProfileEdit", () => {
  describe("handleEdit", () => {
    it("should populate editing state and form data from the selected profile", () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const setEditingProfile = vi.fn();
      const setFormData = vi.fn();
      const profile = seededProfile();

      const { result } = renderHook(
        () =>
          useProfileEdit({
            formData: { name: "" },
            editingProfile: null,
            setFormData,
            setEditingProfile,
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
        name: "Original",
        bodyWeight: 70,
      });
    });
  });

  describe("handleSave", () => {
    it("should persist updates and clear editing state on success", async () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const profile = seededProfile();
      await persistence.profiles.put(profile);
      const setEditingProfile = vi.fn();
      const setFormData = vi.fn();
      const formData: ProfileFormData = { name: "Renamed", bodyWeight: 75 };

      const { result } = renderHook(
        () =>
          useProfileEdit({
            formData,
            editingProfile: profile,
            setFormData,
            setEditingProfile,
          }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.handleSave();
      });

      // Assert
      await waitFor(async () => {
        const fresh = await persistence.profiles.getById(profile.id);
        expect(fresh?.name).toBe("Renamed");
        expect(fresh?.bodyWeight).toBe(75);
      });
      expect(setEditingProfile).toHaveBeenCalledWith(null);
      expect(setFormData).toHaveBeenCalledWith({ name: "" });
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("should prefer override data over hook formData when provided", async () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const profile = seededProfile();
      await persistence.profiles.put(profile);
      const setEditingProfile = vi.fn();
      const setFormData = vi.fn();
      const baseFormData: ProfileFormData = { name: "Stale" };

      const { result } = renderHook(
        () =>
          useProfileEdit({
            formData: baseFormData,
            editingProfile: profile,
            setFormData,
            setEditingProfile,
          }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.handleSave({ name: "FromOverride", bodyWeight: 80 });
      });

      // Assert
      await waitFor(async () => {
        const fresh = await persistence.profiles.getById(profile.id);
        expect(fresh?.name).toBe("FromOverride");
        expect(fresh?.bodyWeight).toBe(80);
      });
    });

    it("should do nothing when no profile is currently being edited", () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const setEditingProfile = vi.fn();
      const setFormData = vi.fn();
      const putSpy = vi.spyOn(persistence.profiles, "put");

      const { result } = renderHook(
        () =>
          useProfileEdit({
            formData: { name: "Whatever" },
            editingProfile: null,
            setFormData,
            setEditingProfile,
          }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.handleSave();
      });

      // Assert
      expect(putSpy).not.toHaveBeenCalled();
      expect(setEditingProfile).not.toHaveBeenCalled();
      expect(setFormData).not.toHaveBeenCalled();
    });

    it("should do nothing when the trimmed form name is empty", () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const profile = seededProfile();
      const setEditingProfile = vi.fn();
      const setFormData = vi.fn();
      const putSpy = vi.spyOn(persistence.profiles, "put");

      const { result } = renderHook(
        () =>
          useProfileEdit({
            formData: { name: "   " },
            editingProfile: profile,
            setFormData,
            setEditingProfile,
          }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.handleSave();
      });

      // Assert
      expect(putSpy).not.toHaveBeenCalled();
      expect(setEditingProfile).not.toHaveBeenCalled();
    });

    it("should surface a toast error when persistence rejects mid-save", async () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const profile = seededProfile();
      await persistence.profiles.put(profile);
      persistence.profiles.put = vi.fn(() =>
        Promise.reject(new Error("simulated"))
      );
      const setEditingProfile = vi.fn();
      const setFormData = vi.fn();

      const { result } = renderHook(
        () =>
          useProfileEdit({
            formData: { name: "Will Fail" },
            editingProfile: profile,
            setFormData,
            setEditingProfile,
          }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.handleSave();
      });

      // Assert
      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          "Failed to save profile — please retry."
        );
      });
      expect(setEditingProfile).not.toHaveBeenCalledWith(null);
    });
  });

  describe("handleCancel", () => {
    it("should clear editing state and reset the form", () => {
      // Arrange
      errorSpy.mockReset();
      const persistence = createInMemoryPersistence();
      const profile = seededProfile();
      const setEditingProfile = vi.fn();
      const setFormData = vi.fn();

      const { result } = renderHook(
        () =>
          useProfileEdit({
            formData: { name: "Half-typed" },
            editingProfile: profile,
            setFormData,
            setEditingProfile,
          }),
        { wrapper: wrap(persistence) }
      );

      // Act
      act(() => {
        result.current.handleCancel();
      });

      // Assert
      expect(setEditingProfile).toHaveBeenCalledWith(null);
      expect(setFormData).toHaveBeenCalledWith({ name: "" });
    });
  });
});
