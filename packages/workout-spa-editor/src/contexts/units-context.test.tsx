import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UnitsProvider, useUnits } from "./units-context";

vi.mock("../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1", profile: null }),
}));

const prefsMock = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock("../hooks/use-user-preferences", () => ({
  useUserPreferences: () => prefsMock.value,
}));

const Probe = () => <span data-testid="units">{useUnits()}</span>;

describe("useUnits", () => {
  it("should default to metric outside a provider", () => {
    // Arrange
    prefsMock.value = undefined;

    // Act
    render(<Probe />);

    // Assert
    expect(screen.getByTestId("units")).toHaveTextContent("metric");
  });

  it("should default to metric when the preference is absent", () => {
    // Arrange
    prefsMock.value = { profileId: "p1", calendarView: "grid" };

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
    prefsMock.value = {
      profileId: "p1",
      calendarView: "grid",
      units: "imperial",
    };

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
