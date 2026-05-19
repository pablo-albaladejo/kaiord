import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useTrain2GoStore } from "../../../store/train2go-store";
import { renderWithProviders } from "../../../test-utils";
import { StatusHeader } from "./StatusHeader";

describe("StatusHeader", () => {
  afterEach(() => {
    useTrain2GoStore.setState({
      extensionInstalled: false,
      sessionActive: false,
    });
  });

  it("should render the nav, profile button and new-workout button", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(screen.getByTestId("status-header")).toBeInTheDocument();
    expect(
      screen.getByTestId("status-header-profile-button")
    ).toBeInTheDocument();
    expect(screen.getByTestId("status-header-new-button")).toBeInTheDocument();
  });

  it("should show 'No profile' in the profile button when no active profile is loaded", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(
      screen.getByTestId("status-header-profile-button")
    ).toHaveTextContent("No profile");
  });

  it("should hide the Garmin indicator when no extension is installed", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(
      screen.queryByTestId("status-header-garmin")
    ).not.toBeInTheDocument();
  });

  it("should hide the Train2Go indicator when no extension is installed", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader />);

    // Assert

    expect(screen.queryByTestId("status-header-sync")).not.toBeInTheDocument();
  });

  it("should show Train2Go 'Synced' when the extension is installed", () => {
    // Arrange
    useTrain2GoStore.setState({ extensionInstalled: true });

    // Act
    renderWithProviders(<StatusHeader />);

    // Assert
    expect(screen.getByTestId("status-header-sync")).toHaveTextContent(
      "Train2Go: Synced"
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
