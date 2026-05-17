import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { StatusHeader } from "./StatusHeader";

describe("StatusHeader", () => {
  it("should render all four surfaces (profile / Garmin / Sync / + New)", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(screen.getByTestId("status-header")).toBeInTheDocument();
    expect(screen.getByTestId("status-header-profile")).toBeInTheDocument();
    expect(screen.getByTestId("status-header-garmin")).toBeInTheDocument();
    expect(screen.getByTestId("status-header-sync")).toBeInTheDocument();
    expect(screen.getByTestId("status-header-new-button")).toBeInTheDocument();
  });

  it("should show 'No profile' when no active profile is loaded", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(screen.getByTestId("status-header-profile")).toHaveTextContent(
      "No profile"
    );
  });

  it("should show Garmin status 'Offline' when no extension is installed", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(screen.getByTestId("status-header-garmin")).toHaveTextContent(
      "Garmin: Offline"
    );
  });

  it("should show Sync status 'Synced' when no pending zone conflict is staged", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(screen.getByTestId("status-header-sync")).toHaveTextContent(
      "Sync: Synced"
    );
  });

  it("should label the new-workout button as 'New workout'", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(screen.getByTestId("status-header-new-button")).toHaveTextContent(
      "New workout"
    );
  });
});
