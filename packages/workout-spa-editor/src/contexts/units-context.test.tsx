import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UnitsProvider, useUnits } from "./units-context";

const prefsMock = vi.hoisted(() => ({ value: {} as unknown }));

vi.mock("../hooks/use-device-preferences", () => ({
  useDevicePreferences: () => ({
    prefs: prefsMock.value,
    ready: true,
    update: vi.fn(),
  }),
}));

const Probe = () => <span data-testid="units">{useUnits()}</span>;

describe("useUnits", () => {
  it("should default to metric outside a provider", () => {
    // Arrange
    prefsMock.value = {};

    // Act
    render(<Probe />);

    // Assert
    expect(screen.getByTestId("units")).toHaveTextContent("metric");
  });

  it("should default to metric when the preference is absent", () => {
    // Arrange
    prefsMock.value = {};

    // Act
    render(
      <UnitsProvider>
        <Probe />
      </UnitsProvider>
    );

    // Assert
    expect(screen.getByTestId("units")).toHaveTextContent("metric");
  });

  it("should expose the persisted imperial preference", () => {
    // Arrange
    prefsMock.value = { units: "imperial" };

    // Act
    render(
      <UnitsProvider>
        <Probe />
      </UnitsProvider>
    );

    // Assert
    expect(screen.getByTestId("units")).toHaveTextContent("imperial");
  });
});
