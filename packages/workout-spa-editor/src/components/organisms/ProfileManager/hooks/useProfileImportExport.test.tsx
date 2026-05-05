/**
 * useProfileImportExport hook tests.
 *
 * Drives the export (Blob/anchor flow stubbed via createObjectURL) and
 * import (file → JSON → schema validate → createProfile) handlers
 * against an in-memory PersistencePort. Covers happy paths, missing
 * file (silent return), invalid JSON, and schema-validation errors.
 */

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeProfile } from "../../../../application/profile/test-fixtures";
import { PersistenceProvider } from "../../../../contexts/persistence-context";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../../types/profile";
import { useProfileImportExport } from "./useProfileImportExport";

const wrap = (persistence: PersistencePort) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  return Wrapper;
};

type FakeFile = {
  text: () => Promise<string>;
};

const fakeChangeEvent = (
  file: FakeFile | null
): React.ChangeEvent<HTMLInputElement> => {
  const input = { value: "file-name.json" } as { value: string };
  return {
    target: {
      ...input,
      files: file ? [file] : [],
    },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
};

describe("useProfileImportExport", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("handleExport", () => {
    it("should serialize the profile and trigger a download via createObjectURL", () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const setImportError = vi.fn();
      const profile: Profile = makeProfile({
        id: "00000000-0000-4000-8000-0000000000e1",
        name: "Pablo Albaladejo",
      });
      const clickSpy = vi.fn();
      const realCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tag: string) => {
          const el = realCreateElement(tag);
          if (tag === "a") {
            (el as HTMLAnchorElement).click = clickSpy;
          }
          return el;
        });

      const { result } = renderHook(
        () => useProfileImportExport({ setImportError }),
        { wrapper: wrap(persistence) }
      );

      // Act
      result.current.handleExport(profile);

      // Assert
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");

      createElementSpy.mockRestore();
    });

    it("should produce a kebab-cased filename derived from the profile name", () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const setImportError = vi.fn();
      const profile: Profile = makeProfile({
        id: "00000000-0000-4000-8000-0000000000e2",
        name: "Mountain Bike Pro",
      });
      let observedDownload = "";
      const realCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tag: string) => {
          const el = realCreateElement(tag);
          if (tag === "a") {
            (el as HTMLAnchorElement).click = () => {
              observedDownload = (el as HTMLAnchorElement).download;
            };
          }
          return el;
        });

      const { result } = renderHook(
        () => useProfileImportExport({ setImportError }),
        { wrapper: wrap(persistence) }
      );

      // Act
      result.current.handleExport(profile);

      // Assert
      expect(observedDownload).toBe("profile-mountain-bike-pro.json");

      createElementSpy.mockRestore();
    });
  });

  describe("handleImport", () => {
    it("should create a profile from a valid JSON file and clear the input", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const setImportError = vi.fn();
      const validProfile: Profile = makeProfile({
        id: "00000000-0000-4000-8000-0000000000f1",
        name: "Imported",
      });
      const file: FakeFile = {
        text: () => Promise.resolve(JSON.stringify(validProfile)),
      };
      const event = fakeChangeEvent(file);

      const { result } = renderHook(
        () => useProfileImportExport({ setImportError }),
        { wrapper: wrap(persistence) }
      );

      // Act
      await result.current.handleImport(event);

      // Assert
      const all = await persistence.profiles.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]?.name).toBe("Imported");
      expect(setImportError).toHaveBeenCalledWith(null);
      expect(event.target.value).toBe("");
    });

    it("should silently no-op when no file is selected", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const setImportError = vi.fn();
      const event = fakeChangeEvent(null);

      const { result } = renderHook(
        () => useProfileImportExport({ setImportError }),
        { wrapper: wrap(persistence) }
      );

      // Act
      await result.current.handleImport(event);

      // Assert
      expect(setImportError).not.toHaveBeenCalled();
      expect(await persistence.profiles.getAll()).toEqual([]);
    });

    it("should report a parse error when the file is not valid JSON", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const setImportError = vi.fn();
      const file: FakeFile = {
        text: () => Promise.resolve("not json"),
      };
      const event = fakeChangeEvent(file);

      const { result } = renderHook(
        () => useProfileImportExport({ setImportError }),
        { wrapper: wrap(persistence) }
      );

      // Act
      await result.current.handleImport(event);

      // Assert
      await waitFor(() => {
        expect(setImportError).toHaveBeenCalledWith(
          expect.stringMatching(/^Import failed: /)
        );
      });
      expect(await persistence.profiles.getAll()).toEqual([]);
      expect(event.target.value).toBe("");
    });

    it("should report a schema-validation error when the JSON is shaped wrong", async () => {
      // Arrange
      const persistence = createInMemoryPersistence();
      const setImportError = vi.fn();
      const file: FakeFile = {
        text: () => Promise.resolve(JSON.stringify({ totally: "wrong" })),
      };
      const event = fakeChangeEvent(file);

      const { result } = renderHook(
        () => useProfileImportExport({ setImportError }),
        { wrapper: wrap(persistence) }
      );

      // Act
      await result.current.handleImport(event);

      // Assert
      await waitFor(() => {
        expect(setImportError).toHaveBeenCalledWith(
          expect.stringMatching(/^Import failed: /)
        );
      });
      expect(await persistence.profiles.getAll()).toEqual([]);
    });
  });
});
