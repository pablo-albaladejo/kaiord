import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MainLayout } from "./MainLayout";

describe("MainLayout", () => {
  it("should render children content", () => {
    // Arrange & Act
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Assert
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should render app title", () => {
    // Arrange & Act
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    // Assert
    expect(screen.getByText("Workout Editor")).toBeInTheDocument();
  });

  it("should render header with logo", () => {
    // Arrange & Act
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    // Assert
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("sticky");
  });

  it("should render main content area", () => {
    // Arrange & Act
    render(
      <MainLayout>
        <div>Main Content</div>
      </MainLayout>
    );

    // Assert
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("should render navigation landmark", () => {
    // Arrange & Act
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    // Assert
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("should have responsive classes", () => {
    // Arrange & Act
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    // Assert
    const main = screen.getByRole("main");
    expect(main).toHaveClass("px-4", "sm:px-6", "lg:px-8");
  });

  it("should have mobile-first layout structure", () => {
    // Arrange & Act
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    // Assert
    const container = screen.getByRole("main").parentElement;
    expect(container).toHaveClass("min-h-screen", "flex-col");
  });
});
