import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { makeProfile } from "../../../../application/profile/test-fixtures";
import { PersistenceProvider } from "../../../../contexts/persistence-context";
import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import { useProfileCreate } from "./useProfileCreate";
import { useProfileDelete } from "./useProfileDelete";
import { useProfileEdit } from "./useProfileEdit";
import { useProfileSwitch } from "./useProfileSwitch";

const errorSpy = vi.fn();

vi.mock("../../../../contexts/ToastContext", () => ({
  useToastContext: () => ({ error: errorSpy }),
}));
vi.mock("../../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const rejecting = new Proxy(
  {},
  { get: () => () => Promise.reject(new Error("boom")) }
);

const failing = (): PersistencePort => ({
  ...createInMemoryPersistence(),
  profiles: rejecting as PersistencePort["profiles"],
  meta: rejecting as PersistencePort["meta"],
  transaction: () => Promise.reject(new Error("boom")),
});

const wrap = (persistence: PersistencePort) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  return Wrapper;
};

describe("profile manager hooks in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));
  beforeEach(() => errorSpy.mockReset());

  it("should announce the switch in Spanish", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const alice = makeProfile({
      id: "00000000-0000-4000-8000-0000000000a1",
      name: "Alice",
    });
    await persistence.profiles.put(alice);
    const notify = vi.fn();
    const { result } = renderHook(
      () =>
        useProfileSwitch({ profiles: [alice], setSwitchNotification: notify }),
      { wrapper: wrap(persistence) }
    );

    // Act
    act(() => result.current.handleSwitchProfile(alice.id));

    // Assert
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith("Perfil activo: Alice")
    );
  });

  it("should toast the switch failure in Spanish", async () => {
    // Arrange
    const alice = makeProfile({ id: "a1", name: "Alice" });
    const { result } = renderHook(
      () =>
        useProfileSwitch({ profiles: [alice], setSwitchNotification: vi.fn() }),
      { wrapper: wrap(failing()) }
    );

    // Act
    act(() => result.current.handleSwitchProfile("a1"));

    // Assert
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "No se pudo cambiar de perfil. Inténtalo de nuevo."
      )
    );
  });

  it("should toast the create failure in Spanish", async () => {
    // Arrange
    const { result } = renderHook(
      () =>
        useProfileCreate({ formData: { name: "Ana" }, setFormData: vi.fn() }),
      { wrapper: wrap(failing()) }
    );

    // Act
    act(() => result.current.handleCreate());

    // Assert
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "No se pudo crear el perfil. Inténtalo de nuevo."
      )
    );
  });

  it("should toast the save failure in Spanish", async () => {
    // Arrange
    const editing = makeProfile({ id: "e1", name: "Ana" });
    const { result } = renderHook(
      () =>
        useProfileEdit({
          formData: { name: "Ana" },
          editingProfile: editing,
          setFormData: vi.fn(),
          setEditingProfile: vi.fn(),
        }),
      { wrapper: wrap(failing()) }
    );

    // Act
    act(() => result.current.handleSave());

    // Assert
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "No se pudo guardar el perfil. Inténtalo de nuevo."
      )
    );
  });

  it("should toast the delete failure in Spanish", async () => {
    // Arrange
    const { result } = renderHook(
      () => useProfileDelete({ setDeleteConfirmId: vi.fn() }),
      { wrapper: wrap(failing()) }
    );

    // Act
    act(() => result.current.confirmDelete("d1"));

    // Assert
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "No se pudo eliminar el perfil. Inténtalo de nuevo."
      )
    );
  });
});
