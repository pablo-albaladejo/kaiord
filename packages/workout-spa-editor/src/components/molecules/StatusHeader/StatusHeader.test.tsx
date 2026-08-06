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

  it("should render one nav row with the account cluster", () => {
    // Arrange

    // Act
    renderWithProviders(<StatusHeader />);

    // Assert
    expect(screen.getByTestId("status-header")).toBeInTheDocument();
    expect(
      screen.getByTestId("status-header-account-button")
    ).toBeInTheDocument();
    // Creation moved to each route's action row (`page` surface) — the
    // header must not grow the entry back.
    expect(
      screen.queryByTestId("status-header-new-button")
    ).not.toBeInTheDocument();
  });

  it("should render the wellness trends entry pointing at the health hub", () => {
    // Arrange

    // Act
    renderWithProviders(<StatusHeader />);

    // Assert
    const trends = screen.getByTestId("status-header-trends-button");
    expect(trends).toHaveTextContent("Trends");
    expect(trends).toHaveAccessibleName("Open wellness trends");
  });

  it("should render the nutrition entry reachable from the header", () => {
    // Arrange

    // Act
    renderWithProviders(<StatusHeader />);

    // Assert
    expect(
      screen.getByTestId("status-header-nutrition-button")
    ).toHaveAccessibleName("Open nutrition");
  });

  it("should render the zone divider between the nav and the account cluster", () => {
    // Arrange

    // Act
    renderWithProviders(<StatusHeader />);

    // Assert
    const divider = screen.getByTestId("status-header-divider");
    const parent = divider.parentElement;
    expect(parent).not.toBeNull();
    const children = Array.from(parent!.children);
    const account = screen.getByTestId("status-header-account-button");
    expect(children.indexOf(divider)).toBeLessThan(children.indexOf(account));
  });

  it("should show no source-health pill while nothing is down", () => {
    // Arrange
    // Reachable state: a browser with no extensions, or one where every
    // probe answered with a live session. Both leave every card non-amber.

    // Act
    renderWithProviders(<StatusHeader />);

    // Assert
    expect(
      screen.queryByTestId("status-header-source-health")
    ).not.toBeInTheDocument();
  });

  it.each([
    { label: "Garmin", testId: "status-header-garmin" },
    { label: "Train2Go", testId: "status-header-sync" },
  ])("should no longer render the $label chip", ({ testId }) => {
    // Arrange
    // The chips rendered whenever their extension was installed — in the
    // healthy case too, which is why they stopped being a signal.
    useTrain2GoStore.setState({ extensionInstalled: true });

    // Act
    renderWithProviders(<StatusHeader />);

    // Assert
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  });
});
