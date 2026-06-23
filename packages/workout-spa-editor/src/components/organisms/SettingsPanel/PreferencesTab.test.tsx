import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PreferencesTab } from "./PreferencesTab";

const setPrefs = vi.fn().mockResolvedValue(undefined);
const prefsMock = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1", profile: null }),
}));

vi.mock("../../../hooks/use-user-preferences", () => ({
  useUserPreferences: () => prefsMock.value,
}));

vi.mock("../../../hooks/use-set-user-preference-fields", () => ({
  useSetUserPreferenceFields: () => setPrefs,
}));

describe("PreferencesTab", () => {
  it("should reflect the persisted metric units as the active segment", () => {
    // Arrange
    prefsMock.value = {
      profileId: "p1",
      calendarView: "grid",
      units: "metric",
    };

    // Act
    render(<PreferencesTab />);

    // Assert
    expect(screen.getByRole("radio", { name: "Metric" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("should persist the imperial units selection on change", () => {
    // Arrange
    setPrefs.mockClear();
    prefsMock.value = {
      profileId: "p1",
      calendarView: "grid",
      units: "metric",
    };
    render(<PreferencesTab />);

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Imperial" }));

    // Assert
    expect(setPrefs).toHaveBeenCalledWith({ units: "imperial" });
  });
});
