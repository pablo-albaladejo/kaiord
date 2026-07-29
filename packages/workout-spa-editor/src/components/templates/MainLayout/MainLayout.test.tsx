import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { MainLayout } from "./MainLayout";

describe("MainLayout", () => {
  it.each([
    {
      label: "children content",
      finder: () => screen.getByText("Test Content"),
    },
    {
      label: "app title",
      finder: () => screen.getByText("Kaiord Editor"),
    },
    {
      label: "header/logo banner",
      finder: () => screen.getByRole("banner"),
    },
    {
      label: "navigation landmark",
      finder: () => screen.getByRole("navigation", { name: "Main navigation" }),
    },
    {
      label: "floating bottom navigation",
      finder: () => screen.getByRole("navigation", { name: "Primary" }),
    },
    {
      // The theme toggle moved into the avatar menu with the rest of the
      // account-level chrome, so the shell renders its trigger, not the
      // toggle itself.
      label: "account menu trigger",
      finder: () => screen.getByTestId("status-header-account-button"),
    },
  ])("should render $label", ({ finder }) => {
    // Arrange

    // Act

    renderWithProviders(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
      { defaultTheme: "light" }
    );

    // Assert

    expect(finder()).toBeInTheDocument();
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
});
