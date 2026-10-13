import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appI18n } from "../../../i18n/i18n";
import { PreferencesTab } from "./PreferencesTab";

const setPrefs = vi.fn();
const prefsMock = vi.hoisted(() => ({ value: {} as unknown }));
const readyMock = vi.hoisted(() => ({ value: true }));

vi.mock("../../../hooks/use-device-preferences", () => ({
  useDevicePreferences: () => ({
    prefs: prefsMock.value,
    ready: readyMock.value,
    update: setPrefs,
  }),
}));

const renderTab = (ui: ReactElement) =>
  render(<I18nextProvider i18n={appI18n}>{ui}</I18nextProvider>);

describe("PreferencesTab", () => {
  beforeEach(() => {
    readyMock.value = true;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should reflect the persisted metric units as the active segment", () => {
    // Arrange
    prefsMock.value = { units: "metric" };

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
    prefsMock.value = { units: "metric" };
    renderTab(<PreferencesTab />);

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Imperial" }));

    // Assert
    expect(setPrefs).toHaveBeenCalledWith({ units: "imperial" });
  });

  it("should reflect an absent locale preference as the Auto segment", () => {
    // Arrange
    prefsMock.value = { units: "metric" };

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
    prefsMock.value = { units: "metric" };
    renderTab(<PreferencesTab />);

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "Spanish" }));

    // Assert
    expect(setPrefs).toHaveBeenCalledWith({ locale: "es" });
  });

  it("should keep the units and language controls disabled until the device preferences are seeded", () => {
    // Arrange
    readyMock.value = false;
    prefsMock.value = {};

    // Act
    renderTab(<PreferencesTab />);

    // Assert
    expect(screen.getByRole("radio", { name: "Imperial" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Spanish" })).toBeDisabled();
  });

  it("should enable the units control once the device preferences are seeded", () => {
    // Arrange
    prefsMock.value = {};

    // Act
    renderTab(<PreferencesTab />);

    // Assert
    expect(screen.getByRole("radio", { name: "Imperial" })).toBeEnabled();
  });

  it("should keep the notifications switch disabled until the device preferences are seeded", () => {
    // Arrange
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn(),
    });
    readyMock.value = false;
    prefsMock.value = {};

    // Act
    renderTab(<PreferencesTab />);

    // Assert
    expect(
      screen.getByRole("switch", { name: /enable notifications/i })
    ).toBeDisabled();
  });
});
