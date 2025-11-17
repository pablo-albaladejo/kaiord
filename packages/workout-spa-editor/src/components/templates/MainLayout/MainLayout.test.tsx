import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import { MainLayout } from "./MainLayout";

describe("MainLayout", () => {
  it("should render children content", () => {
    // Arrange & Act
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
    // Arrange & Act
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert
    expect(screen.getByText("Workout Editor")).toBeInTheDocument();
  });

  it("should render header with logo", () => {
    // Arrange & Act
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("sticky");
  });

  it("should render main content area", () => {
    // Arrange & Act
    renderWithProviders(
      <MainLayout>
        <div>Main Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("should render navigation landmark", () => {
    // Arrange & Act
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("should have responsive classes", () => {
    // Arrange & Act
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert
    const main = screen.getByRole("main");
    expect(main).toHaveClass("px-4", "sm:px-6", "lg:px-8");
  });

  it("should have mobile-first layout structure", () => {
    // Arrange & Act
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert
    const container = screen.getByRole("main").parentElement;
    expect(container).toHaveClass("min-h-screen", "flex-col");
  });

  it("should render theme toggle button", () => {
    // Arrange & Act
    renderWithProviders(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert
    const themeToggle = screen.getByRole("button", {
      name: /switch to (light|dark) mode/i,
    });
    expect(themeToggle).toBeInTheDocument();
  });
});
