import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

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

    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert

    expect(
      screen.getByTestId("status-header-profile-button")
    ).toHaveTextContent("No profile");
  });

  it("should hide the Garmin indicator when no extension is installed", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert

    expect(
      screen.queryByTestId("status-header-garmin")
    ).not.toBeInTheDocument();
  });

  it("should hide the Train2Go indicator when no extension is installed", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert

    expect(screen.queryByTestId("status-header-sync")).not.toBeInTheDocument();
  });

  it("should show Train2Go 'Synced' when the extension is installed", () => {
    // Arrange
    useTrain2GoStore.setState({ extensionInstalled: true });

    // Act
    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert
    expect(screen.getByTestId("status-header-sync")).toHaveTextContent(
      "Train2Go: Synced"
    );
  });

  it("should render the wellness trends entry pointing at the health hub", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert

    const trends = screen.getByTestId("status-header-trends-button");
    expect(trends).toBeInTheDocument();
    expect(trends).toHaveTextContent("Trends");
    expect(trends).toHaveAccessibleName("Open wellness trends");
  });

  it("should render the nutrition entry reachable from the header (desktop)", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert

    const nutrition = screen.getByTestId("status-header-nutrition-button");
    expect(nutrition).toBeInTheDocument();
    expect(nutrition).toHaveAccessibleName("Open nutrition");
  });

  it("should label the new-workout button as 'New workout'", () => {
    // Arrange

    // Act

    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert

    expect(screen.getByTestId("status-header-new-button")).toHaveTextContent(
      "New workout"
    );
  });

  it("should render the zone divider between the primary nav and the account cluster", () => {
    // Arrange

    // Act
    renderWithProviders(<StatusHeader onHelpClick={vi.fn()} />);

    // Assert
    const divider = screen.getByTestId("status-header-divider");
    const newButton = screen.getByTestId("status-header-new-button");
    const profileButton = screen.getByTestId("status-header-profile-button");
    expect(divider).toBeInTheDocument();
    const parent = divider.parentElement;
    expect(parent).not.toBeNull();
    const children = Array.from(parent!.children);
    const dividerIndex = children.indexOf(divider);
    const newButtonIndex = children.indexOf(newButton);
    const profileButtonIndex = children.indexOf(profileButton);
    expect(dividerIndex).toBeGreaterThan(newButtonIndex);
    expect(dividerIndex).toBeLessThan(profileButtonIndex);
  });
});
