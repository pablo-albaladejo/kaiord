import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { useWorkoutStore } from "../../../store/workout-store";
import { renderWithProviders } from "../../../test-utils";
import { LayoutHeader } from "./LayoutHeader";

function withRouter(ui: React.ReactNode, path = "/calendar") {
  const loc = memoryLocation({ path, record: true });
  return { ui: <Router hook={loc.hook}>{ui}</Router>, location: loc };
}

describe("LayoutHeader", () => {
  beforeEach(async () => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
    await Promise.all([
      db.table("profiles").clear(),
      db.table("meta").clear(),
      db.table("templates").clear(),
    ]);
  });

  describe("rendering", () => {
    it.each<[string, () => HTMLElement]>([
      ["brand label", () => screen.getByLabelText(/kaiord editor/i)],
      [
        "account menu trigger",
        () => screen.getByTestId("status-header-account-button"),
      ],
      [
        "athlete entry button",
        () => screen.getByTestId("status-header-athlete-button"),
      ],
    ])("should render the %s", (_label, query) => {
      // Arrange

      renderWithProviders(<LayoutHeader />);

      // Act

      const element = query();

      // Assert

      expect(element).toBeInTheDocument();
    });

    it("should always render the StatusHeader (no feature flag gate)", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(screen.getByTestId("status-header")).toBeInTheDocument();
    });
  });

  describe("active profile surface", () => {
    it("should name the account menu for no profile when none is loaded", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByTestId("status-header-account-button")
      ).toHaveAccessibleName("Account menu (no active profile)");
    });

    it("should name the account menu for the active profile once Dexie hydrates", async () => {
      // Arrange
      const persistence = createDexiePersistence(db);
      await createProfile(persistence, "My Training Profile");

      // Act
      renderWithProviders(<LayoutHeader />, { persistence });

      // Assert
      expect(
        await screen.findByLabelText("Account menu (My Training Profile)")
      ).toBeInTheDocument();
    });
  });

  describe("entry-button navigation", () => {
    it("should navigate to /athlete when the athlete entry is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const { ui, location } = withRouter(<LayoutHeader />);
      renderWithProviders(ui);

      // Act
      await user.click(screen.getByTestId("status-header-athlete-button"));

      // Assert
      expect(location.history).toContain("/athlete");
    });

    it("should navigate to /settings from the account menu", async () => {
      // Arrange
      const user = userEvent.setup();
      const { ui, location } = withRouter(<LayoutHeader />);
      renderWithProviders(ui);

      // Act
      await user.click(screen.getByTestId("status-header-account-button"));
      await user.click(await screen.findByTestId("account-menu-item-settings"));

      // Assert
      expect(location.history).toContain("/settings");
    });

    it("should not offer workout creation from the header", () => {
      // Arrange
      const { ui } = withRouter(<LayoutHeader />);
      renderWithProviders(ui);

      // Act

      // Assert
      // Creation lives on each route's action row (CreateWorkoutCta);
      // the header carries navigation only.
      expect(
        screen.queryByTestId("status-header-new-button")
      ).not.toBeInTheDocument();
    });
  });

  describe("retired help surfaces", () => {
    it("should not render a help entry button", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByTestId("status-header-help-button")
      ).not.toBeInTheDocument();
    });

    it("should not render the retired help dialog heading", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /help & documentation/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should expose the StatusHeader as the navigation landmark", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByRole("navigation", { name: /main navigation/i })
      ).toBeInTheDocument();
    });

    it("should NOT promote the brand label to an h1 (route owns the page heading)", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /kaiord editor/i })
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText(/kaiord editor/i)).toBeInTheDocument();
    });
  });
});
