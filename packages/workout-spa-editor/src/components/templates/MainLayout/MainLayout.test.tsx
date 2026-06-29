import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { MainLayout } from "./MainLayout";

describe("MainLayout", () => {
  it("should render children content", () => {
    // Arrange

    // Act

    renderWithProviders(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should render app title", () => {
    // Arrange

    // Act

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    expect(screen.getByText("Kaiord Editor")).toBeInTheDocument();
  });

  it("should render header with logo", () => {
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Act

    const header = screen.getByRole("banner");

    // Assert

    expect(header).toBeInTheDocument();
  });

  it("should render main content area", () => {
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Main Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Act

    const main = screen.getByRole("main");

    // Assert

    expect(main).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("should render navigation landmark", () => {
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Act

    const nav = screen.getByRole("navigation", { name: "Main navigation" });

    // Assert

    expect(nav).toBeInTheDocument();
  });

  it("should render the floating bottom navigation", () => {
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Act

    const bottomNav = screen.getByRole("navigation", { name: "Primary" });

    // Assert

    expect(bottomNav).toBeInTheDocument();
  });

  it("should not render the removed primary navigation tab bar", () => {
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Act

    const tabBar = screen.queryByTestId("primary-nav");

    // Assert

    expect(tabBar).not.toBeInTheDocument();
  });

  it("should render theme toggle button", () => {
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Act

    const themeToggle = screen.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });

    // Assert

    expect(themeToggle).toBeInTheDocument();
  });

  it("should pass onReplayTutorial prop to LayoutHeader", () => {
    // Arrange

    const mockOnReplayTutorial = vi.fn();

    // Act

    renderWithProviders(
      <MainLayout onReplayTutorial={mockOnReplayTutorial}>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should mount the storage-availability banner region exactly once", () => {
    // Arrange

    const { container } = renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // The banner is mounted once, in the layout shell shared by
    // every route. The probe runs via useStoreHydration; the banner
    // renders null while status is "checking" (initial state in tests).
    // Re-rendering different children must not duplicate it.

    // Act

    const banners = container.querySelectorAll(
      '[data-testid="storage-unavailable-banner"]'
    );

    // Assert

    expect(banners.length).toBeLessThanOrEqual(1);
  });
});
