import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appI18n } from "../../../i18n/i18n";
import { PreferencesTab } from "./PreferencesTab";

const setPrefs = vi.fn().mockResolvedValue(undefined);
const prefsMock = vi.hoisted(() => ({ value: undefined as unknown }));
const activeMock = vi.hoisted(() => ({
  value: { id: "p1", profile: null } as
    { id: string | null; profile: null } | undefined,
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => activeMock.value,
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
  beforeEach(() => {
    activeMock.value = { id: "p1", profile: null };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("should keep the units and language controls disabled until the active profile resolves", () => {
    // Arrange
    activeMock.value = undefined;
    prefsMock.value = undefined;

    // Act
    renderTab(<PreferencesTab />);

    // Assert
    expect(screen.getByRole("radio", { name: "Imperial" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Spanish" })).toBeDisabled();
  });

  it("should enable the units control once the active profile resolves", () => {
    // Arrange
    prefsMock.value = { profileId: "p1", calendarView: "grid" };

    // Act
    renderTab(<PreferencesTab />);

    // Assert
    expect(screen.getByRole("radio", { name: "Imperial" })).toBeEnabled();
  });

  it("should keep the notifications switch disabled until the active profile resolves", () => {
    // Arrange
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn(),
    });
    activeMock.value = undefined;
    prefsMock.value = undefined;

    // Act
    renderTab(<PreferencesTab />);

    // Assert
    expect(
      screen.getByRole("switch", { name: /enable notifications/i })
    ).toBeDisabled();
  });
});
