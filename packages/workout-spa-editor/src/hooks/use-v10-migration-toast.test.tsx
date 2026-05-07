import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const consumeMock = vi.fn();
const infoToast = vi.fn();
const event = vi.fn();

vi.mock("../adapters/dexie/dexie-v10-migration", () => ({
  consumeLastV10Result: () => consumeMock(),
}));

vi.mock("../contexts", () => ({
  useAnalytics: () => ({ event, pageView: vi.fn() }),
}));

vi.mock("../contexts/ToastContext", () => ({
  useToastContext: () => ({ info: infoToast }),
}));

import { useV10MigrationToast } from "./use-v10-migration-toast";

const wrapper = ({ children }: { children: ReactNode }) => <>{children}</>;

afterEach(() => {
  consumeMock.mockReset();
  infoToast.mockReset();
  event.mockReset();
});

describe("useV10MigrationToast", () => {
  it("should fire neither analytics nor toast when no migration result is pending", () => {
    // Arrange
    consumeMock.mockReturnValue(null);

    // Act
    renderHook(() => useV10MigrationToast(), { wrapper });

    // Assert
    expect(event).not.toHaveBeenCalled();
    expect(infoToast).not.toHaveBeenCalled();
  });

  it("should emit analytics with count=0 and skip the toast on a no-op migration", () => {
    // Arrange
    consumeMock.mockReturnValue({ created: 0 });

    // Act
    renderHook(() => useV10MigrationToast(), { wrapper });

    // Assert
    expect(event).toHaveBeenCalledWith("coaching.dexie_v10.migrated", {
      count: 0,
    });
    expect(infoToast).not.toHaveBeenCalled();
  });

  it("should emit analytics and a singular toast title when one match was created", () => {
    // Arrange
    consumeMock.mockReturnValue({ created: 1 });

    // Act
    renderHook(() => useV10MigrationToast(), { wrapper });

    // Assert
    expect(event).toHaveBeenCalledWith("coaching.dexie_v10.migrated", {
      count: 1,
    });
    expect(infoToast).toHaveBeenCalledWith(
      "1 workout linked to coaching activities"
    );
  });

  it("should emit analytics and a plural toast title when N matches were created", () => {
    // Arrange
    consumeMock.mockReturnValue({ created: 3 });

    // Act
    renderHook(() => useV10MigrationToast(), { wrapper });

    // Assert
    // Toast title is a static string per R-PIIInterpolation; the
    // concrete count is surfaced via the analytics event payload.
    expect(event).toHaveBeenCalledWith("coaching.dexie_v10.migrated", {
      count: 3,
    });
    expect(infoToast).toHaveBeenCalledWith(
      "Workouts linked to coaching activities"
    );
  });
});
