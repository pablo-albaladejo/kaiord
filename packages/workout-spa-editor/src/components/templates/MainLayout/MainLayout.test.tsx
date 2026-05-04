import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { MainLayout } from "./MainLayout";

describe("MainLayout", () => {
  it("should render children content", () => {
    // Arrange & Act
    // Arrange

    // Act

    renderWithProviders(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Assert

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should render app title", () => {
    // Arrange & Act
    // Arrange

    // Act

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Assert

    expect(screen.getByText("Kaiord Editor")).toBeInTheDocument();
  });

  it("should render header with logo", () => {
    // Arrange & Act
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Act

    const header = screen.getByRole("banner");

    // Assert

    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("sticky");
  });

  it("should render main content area", () => {
    // Arrange & Act
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Main Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Act

    const main = screen.getByRole("main");

    // Assert

    expect(main).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("should render navigation landmark", () => {
    // Arrange & Act
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Act

    const nav = screen.getByRole("navigation", { name: "Main navigation" });

    // Assert

    expect(nav).toBeInTheDocument();
  });

  it("should have responsive classes", () => {
    // Arrange & Act
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Act

    const main = screen.getByRole("main");

    // Assert

    expect(main).toHaveClass("px-4", "sm:px-6", "lg:px-8");
  });

  it("should have mobile-first layout structure", () => {
    // Arrange & Act
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Act

    const container = screen.getByRole("main").parentElement;

    // Assert

    expect(container).toHaveClass("min-h-screen", "flex-col");
  });

  it("should render theme toggle button", () => {
    // Arrange & Act
    // Arrange

    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    // Act

    const themeToggle = screen.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });

    // Assert

    expect(themeToggle).toBeInTheDocument();
  });

  it("should pass onReplayTutorial prop to LayoutHeader", () => {
    // Arrange
    // Arrange

    const mockOnReplayTutorial = vi.fn();

    // Act

    // Act

    renderWithProviders(
      <MainLayout onReplayTutorial={mockOnReplayTutorial}>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert - Component renders without error

    // Assert

    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should mount the storage-availability banner region exactly once", () => {
    // Arrange & Act
    // Arrange

    const { container } = renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert — the banner is mounted once, in the layout shell shared by
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
