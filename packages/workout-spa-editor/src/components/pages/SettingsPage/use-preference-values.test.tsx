import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePreferenceValues } from "./use-preference-values";

const prefs = vi.hoisted(() => ({ value: {} as unknown }));
const permission = vi.hoisted(() => ({ value: "default" as string }));

vi.mock("../../../hooks/use-device-preferences", () => ({
  useDevicePreferences: () => ({
    prefs: prefs.value,
    ready: true,
    update: vi.fn(),
  }),
}));

vi.mock("../../organisms/SettingsPanel/use-notification-permission", () => ({
  useNotificationPermission: () => ({
    permission: permission.value,
    request: vi.fn(),
  }),
}));

const setUp = (over: { prefs?: unknown; permission?: string }) => {
  prefs.value = over.prefs ?? {};
  permission.value = over.permission ?? "default";
  return renderHook(() => usePreferenceValues()).result;
};

describe("usePreferenceValues", () => {
  it("should render the persisted units and locale as display names", () => {
    // Arrange
    const persisted = {
      units: "imperial",
      locale: "es",
    };

    // Act
    const { current } = setUp({ prefs: persisted });

    // Assert
    expect(current.units).toBe("Imperial");
    expect(current.language).toBe("Spanish");
  });

  it("should resolve an auto locale preference to the active locale", () => {
    // Arrange
    const persisted = { locale: "auto" };

    // Act
    const { current } = setUp({ prefs: persisted });

    // Assert
    expect(current.language).toBe("English");
  });

  it("should fall back to the defaults when the device has no preferences", () => {
    // Arrange

    // Act
    const { current } = setUp({ prefs: {} });

    // Assert
    expect(current.units).toBe("Metric");
    expect(current.language).toBe("English");
    expect(current.notifications).toBe("Off");
  });

  it("should report notifications on only when enabled and granted", () => {
    // Arrange
    const persisted = {
      notificationsEnabled: true,
    };

    // Act
    const granted = setUp({ prefs: persisted, permission: "granted" }).current;
    const pending = setUp({ prefs: persisted, permission: "default" }).current;

    // Assert
    expect(granted.notifications).toBe("On");
    expect(pending.notifications).toBe("Off");
  });

  it("should report notifications blocked when the permission is denied", () => {
    // Arrange

    // Act
    const { current } = setUp({ permission: "denied" });

    // Assert
    expect(current.notifications).toBe("Blocked");
  });

  it("should report notifications unsupported outside a browser", () => {
    // Arrange

    // Act
    const { current } = setUp({ permission: "unsupported" });

    // Assert
    expect(current.notifications).toBe("Unsupported");
  });
});
