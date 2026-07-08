import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import { appI18n } from "../../../i18n/i18n";
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

const renderTab = (ui: ReactElement) =>
  render(<I18nextProvider i18n={appI18n}>{ui}</I18nextProvider>);

describe("PreferencesTab", () => {
  it("should reflect the persisted metric units as the active segment", () => {
    // Arrange
    prefsMock.value = {
      profileId: "p1",
      calendarView: "grid",
      units: "metric",
    };

    // Act
    renderTab(<PreferencesTab />);

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
    renderTab(<PreferencesTab />);

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Imperial" }));

    // Assert
    expect(setPrefs).toHaveBeenCalledWith({ units: "imperial" });
  });

  it("should reflect an absent locale preference as the Auto segment", () => {
    // Arrange
    prefsMock.value = {
      profileId: "p1",
      calendarView: "grid",
      units: "metric",
    };

    // Act
    renderTab(<PreferencesTab />);

    // Assert
    expect(screen.getByRole("radio", { name: "Auto" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("should persist the Spanish language selection on change", () => {
    // Arrange
    setPrefs.mockClear();
    prefsMock.value = {
      profileId: "p1",
      calendarView: "grid",
      units: "metric",
    };
    renderTab(<PreferencesTab />);

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Spanish" }));

    // Assert
    expect(setPrefs).toHaveBeenCalledWith({ locale: "es" });
  });
});
