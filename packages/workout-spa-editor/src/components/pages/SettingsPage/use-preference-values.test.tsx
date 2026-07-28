import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { UseUserPreferencesArgs } from "../../../hooks/use-user-preferences";
import { usePreferenceValues } from "./use-preference-values";

const profileId = vi.hoisted(() => ({ value: "p1" as string | null }));
const prefs = vi.hoisted(() => ({ value: undefined as unknown }));
const permission = vi.hoisted(() => ({ value: "default" as string }));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: profileId.value, profile: null }),
}));

// Mirrors the real contract: a null profileId resolves to `undefined`, which
// is what drives the caller's fallback to the defaults.
vi.mock("../../../hooks/use-user-preferences", () => ({
  useUserPreferences: (args: UseUserPreferencesArgs) =>
    args.profileId === null ? undefined : prefs.value,
}));

vi.mock("../../organisms/SettingsPanel/use-notification-permission", () => ({
  useNotificationPermission: () => ({
    permission: permission.value,
    request: vi.fn(),
  }),
}));

const setUp = (over: {
  id?: string | null;
  prefs?: unknown;
  permission?: string;
}) => {
  profileId.value = over.id === undefined ? "p1" : over.id;
  prefs.value = over.prefs;
  permission.value = over.permission ?? "default";
  return renderHook(() => usePreferenceValues()).result;
};

describe("usePreferenceValues", () => {
  it("should render the persisted units and locale as display names", () => {
    // Arrange
    const persisted = {
      profileId: "p1",
      calendarView: "grid",
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
    const persisted = { profileId: "p1", calendarView: "grid", locale: "auto" };

    // Act
    const { current } = setUp({ prefs: persisted });

    // Assert
    expect(current.language).toBe("English");
  });

  it("should fall back to the defaults when no profile is active", () => {
    // Arrange

    // Act
    const { current } = setUp({ id: null, prefs: undefined });

    // Assert
    expect(current.units).toBe("Metric");
    expect(current.language).toBe("English");
    expect(current.notifications).toBe("Off");
  });

  it("should report notifications on only when enabled and granted", () => {
    // Arrange
    const persisted = {
      profileId: "p1",
      calendarView: "grid",
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
    const { current } = setUp({ prefs: undefined, permission: "denied" });

    // Assert
    expect(current.notifications).toBe("Blocked");
  });

  it("should report notifications unsupported outside a browser", () => {
    // Arrange

    // Act
    const { current } = setUp({ prefs: undefined, permission: "unsupported" });

    // Assert
    expect(current.notifications).toBe("Unsupported");
  });
});
