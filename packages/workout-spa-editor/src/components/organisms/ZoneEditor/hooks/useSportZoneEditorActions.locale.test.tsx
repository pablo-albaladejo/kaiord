import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../../contexts/persistence-context";
import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import { useSportZoneEditorActions } from "./useSportZoneEditorActions";

const errorSpy = vi.fn();

vi.mock("../../../../contexts/ToastContext", () => ({
  useToastContext: () => ({ error: errorSpy }),
}));
vi.mock("../../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("useSportZoneEditorActions in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should toast the zone write failure in Spanish", async () => {
    // Arrange
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={createInMemoryPersistence()}>
        {children}
      </PersistenceProvider>
    );
    const { result } = renderHook(
      () => useSportZoneEditorActions("missing-profile", "cycling"),
      { wrapper }
    );

    // Act
    result.current.handleZonesChange("powerZones", []);

    // Assert
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "No se pudieron actualizar las zonas. Inténtalo de nuevo."
      )
    );
  });
});
